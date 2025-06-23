import type { BBModel, BBModelElement, BBModelOutliner } from "@/bbmodel";
import { parseLua } from "@/data/generateLua";
import type {
	AnimationRef,
	Avatar,
	AvatarMetadata,
	ModelPartRef,
	TextureAsset,
	UUID,
} from "@/types";

// --- Path Utilities (specific to project loading) ---

function withoutExtension(str: string): string {
	const s = str.split(".");
	s.pop();
	return s.join(".");
}

// --- File Reading Helpers ---

const readFileAsText = (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () =>
			reject(new Error(`Failed to read file: ${file.name}`));
		reader.readAsText(file);
	});
};

const readImage = (name: string, imageURL: string): Promise<TextureAsset> => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			resolve({
				name: name,
				url: img.src,
				width: img.width,
				height: img.height,
			});
		};
		img.onerror = () => reject(new Error(`Failed to load image: ${name}`));
		img.src = imageURL;
	});
};

// --- Main Loader Logic ---

export interface LoadedProjectData {
	project: Avatar;
	metadata: AvatarMetadata;
	animations: AnimationRef[];
	modelElements: ModelPartRef[];
	textures: TextureAsset[];
}

export async function loadProjectFromFiles(
	files: FileList,
): Promise<LoadedProjectData> {
	if (!files || files.length === 0) {
		throw new Error("No files provided.");
	}

	let projectFile: File | null = null;
	let metadataFile: File | null = null;
	const bbmodelFiles: File[] = [];
	const imageFiles: File[] = [];
	const imageExtensions = [".png", ".jpg", ".jpeg", ".webp"];

	for (const file of Array.from(files)) {
		const lowerName = file.name.toLowerCase();
		if (lowerName.endsWith(".figura-editor.lua")) {
			if (projectFile) {
				throw new Error(
					'Multiple "figura-editor" files found. Please provide only one.',
				);
			}
			projectFile = file;
		} else if (lowerName === "avatar.json") {
			metadataFile = file;
		} else if (lowerName.endsWith(".bbmodel")) {
			bbmodelFiles.push(file);
		} else if (imageExtensions.some((ext) => lowerName.endsWith(ext))) {
			imageFiles.push(file);
		}
	}

	// Read all files in parallel
	const projectFileContent = projectFile
		? await readFileAsText(projectFile)
		: null;
	const metadataFileContent = metadataFile
		? await readFileAsText(metadataFile)
		: null;
	const bbmodelFileContents = await Promise.all(
		bbmodelFiles.map(readFileAsText),
	);

	// --- Parse project.figura-editor.lua ---
	const projectData: Avatar = projectFileContent
		? parseLua(projectFileContent)
		: {
				actionWheels: {},
				conditionalSettings: {},
				scripts: {},
				keybinds: {},
				exclusiveTags: {},
				layers: {},
			};
	// Basic validation
	if (!projectData.actionWheels || !projectData.conditionalSettings) {
		throw new Error("Invalid or corrupted project.figura-editor.lua format.");
	}

	// Migrations
	projectData.scripts ??= {};
	projectData.keybinds ??= {};
	projectData.exclusiveTags ??= {};
	projectData.layers ??= {};

	// --- Parse avatar.json ---
	let metadata: AvatarMetadata = {};
	if (metadataFileContent) {
		try {
			metadata = JSON.parse(metadataFileContent);
		} catch (_e) {
			throw new Error(
				"Failed to parse avatar.json. Please ensure it's valid JSON.",
			);
		}
	}

	// --- Parse bbmodels and extract animations and textures ---
	const allAnimations: AnimationRef[] = [];
	const allModelElements: ModelPartRef[] = [];
	const allImagesPromises: Promise<TextureAsset>[] = [];

	for (let i = 0; i < bbmodelFiles.length; i++) {
		const file = bbmodelFiles[i];
		const content = bbmodelFileContents[i];
		const modelName = file.name.slice(0, file.name.length - ".bbmodel".length);
		let model: BBModel;
		try {
			model = JSON.parse(content);
		} catch (_e) {
			console.warn(`Skipping non-JSON bbmodel file: ${file.name}`);
			continue;
		}

		if (!model.meta) {
			console.warn(`Skipping invalid or malformed bbmodel file: ${file.name}`);
			continue;
		}

		if (Array.isArray(model.animations)) {
			for (const anim of model.animations) {
				if (anim.name) {
					allAnimations.push({
						model: modelName,
						animation: anim.name,
						loop: anim.loop,
					});
				}
			}
		}

		const elements = new Map<UUID, BBModelElement>();
		if (Array.isArray(model.elements)) {
			for (const element of model.elements) {
				elements.set(element.uuid, element);
			}
		}

		if (Array.isArray(model.outliner)) {
			const traverseOutliner = (
				items: (BBModelOutliner | UUID)[],
				path: string[],
			) => {
				for (const item of items) {
					if (typeof item === "string") {
						const element = elements.get(item);
						if (element) {
							const newPath = [...path, element.name];
							allModelElements.push({ model: modelName, partPath: newPath });
						}
					} else {
						const newPath = [...path, item.name];
						allModelElements.push({ model: modelName, partPath: newPath });
						if (item.children?.length) {
							traverseOutliner(item.children, newPath);
						}
					}
				}
			};
			traverseOutliner(model.outliner, []);
		}

		if (Array.isArray(model.textures)) {
			for (const texture of model.textures) {
				if (!texture.name || !texture.source) continue;
				allImagesPromises.push(
					readImage(
						`${modelName}.${withoutExtension(texture.name)}`,
						texture.source,
					),
				);
			}
		}
	}

	const allTextures = await Promise.all(allImagesPromises);

	return {
		project: projectData,
		metadata,
		animations: allAnimations,
		modelElements: allModelElements,
		textures: allTextures,
	};
}