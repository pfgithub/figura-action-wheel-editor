import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useAvatarStore } from "@/store/avatarStore";
import type { ActionWheel, UUID } from "@/types";
import { generateUUID } from "@/utils/uuid";
import "./index.css";

// Manager Components
import { MetadataEditorDialog } from "@/components/dialogs/MetadataEditorDialog";
import { ActionWheelsManager } from "@/components/managers/ActionWheelsManager";
import { AnimationNodesManager } from "@/components/managers/AnimationNodesManager";
import { AnimationSettingsManager } from "@/components/managers/AnimationSettingsManager";
import { KeybindsManager } from "@/components/managers/KeybindsManager";
import { ScriptsManager } from "@/components/managers/ScriptsManager";
// UI Components
import { Button } from "@/components/ui/Button";
import {
	type LoadedProjectData,
	loadProjectFromFiles,
} from "@/services/projectLoader";

// A component for the file drop area
function FileDropzone({
	onFileLoaded,
	setLoadError,
}: {
	onFileLoaded: (data: LoadedProjectData) => void;
	setLoadError: (error: string | null) => void;
}) {
	const [isDragging, setIsDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFiles = async (files: FileList) => {
		if (!files || files.length === 0) return;
		setLoadError(null); // Reset error on new attempt

		try {
			const loadedData = await loadProjectFromFiles(files);
			onFileLoaded(loadedData);
		} catch (err: any) {
			setLoadError(
				err.message || "An unknown error occurred during file processing.",
			);
		}
	};

	const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			handleFiles(e.dataTransfer.files);
		}
	};

	const handleClick = () => {
		inputRef.current?.click();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			handleFiles(e.target.files);
			// Reset the input value to allow re-uploading the same file(s)
			e.target.value = "";
		}
	};

	return (
		<div
			onClick={handleClick}
			onDrop={handleDrop}
			onDragOver={handleDragOver}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			className={`w-full max-w-2xl h-80 rounded-2xl border-4 border-dashed flex flex-col items-center justify-center text-center p-8 cursor-pointer transition-colors duration-300 ${isDragging ? "border-violet-500 bg-violet-900/20" : "border-slate-700 hover:border-slate-600 bg-slate-800/20"}`}
		>
			<input
				ref={inputRef}
				type="file"
				className="hidden"
				onChange={handleFileChange}
				multiple
			/>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className={`w-20 h-20 mb-6 text-slate-600 transition-colors duration-300 ${isDragging ? "text-violet-500" : ""}`}
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<polyline points="17 8 12 3 7 8" />
				<line x1="12" y1="3" x2="12" y2="15" />
			</svg>
			<h2 className="text-2xl font-bold text-slate-200">
				Drag the entire contents of your figura avatar
			</h2>
			<p className="text-slate-400 mt-2">
				or click and select the full contents of your avatar folder.
			</p>
		</div>
	);
}

type EditorTab =
	| "wheels"
	| "settings"
	| "animation_nodes"
	| "scripts"
	| "keybinds";

export function App() {
	const { avatar, isSaving, saveAvatar, updateAvatar, loadAvatar } =
		useAvatarStore();
	const [viewedWheelUuid, setViewedWheelUuid] = useState<UUID | null>(null);
	const [activeTab, setActiveTab] = useState<EditorTab>("wheels");
	const [fileLoadError, setFileLoadError] = useState<string | null>(null);
	const [isMetadataEditorOpen, setMetadataEditorOpen] = useState(false);

	// Get temporal state and actions for undo/redo
	const { pastStates, futureStates, undo, redo } =
		useAvatarStore.temporal.getState();

	// Effect to keep viewedWheelUuid in sync with the available wheels
	useEffect(() => {
		if (avatar) {
			const currentWheels = Object.values(avatar.actionWheels);
			const isViewedWheelValid =
				viewedWheelUuid && avatar.actionWheels[viewedWheelUuid];

			if (!isViewedWheelValid) {
				// If view is invalid (null or points to a deleted wheel), reset it.
				setViewedWheelUuid(
					avatar.mainActionWheel ?? currentWheels[0]?.uuid ?? null,
				);
			}
		}
	}, [avatar, viewedWheelUuid]);

	const addActionWheel = () => {
		const newWheelUuid = generateUUID();
		updateAvatar((draft) => {
			const newWheel: ActionWheel = {
				uuid: newWheelUuid,
				title: `Wheel ${Object.keys(draft.actionWheels).length + 1}`,
				actions: [],
			};
			draft.actionWheels[newWheel.uuid] = newWheel;
			if (Object.keys(draft.actionWheels).length === 1) {
				draft.mainActionWheel = newWheel.uuid;
			}
		});
		// Set the view to the newly created wheel
		setViewedWheelUuid(newWheelUuid);
	};

	const handleProjectLoad = (data: LoadedProjectData) => {
		loadAvatar(
			data.project,
			data.animations,
			data.modelElements,
			data.textures,
			data.metadata,
		);
	};

	// If no project is loaded, show the dropzone.
	if (!avatar) {
		return (
			<div
				className="text-slate-100 h-screen flex flex-col items-center justify-center bg-slate-900 p-4"
				style={{ fontFamily: "'Inter', sans-serif" }}
			>
				<h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-500 mb-8">
					Avatar Editor
				</h1>
				<FileDropzone
					onFileLoaded={handleProjectLoad}
					setLoadError={setFileLoadError}
				/>
				{fileLoadError && (
					<div className="mt-6 p-4 bg-rose-900/50 border border-rose-700 text-rose-300 rounded-lg max-w-2xl w-full">
						<p>
							<strong>Error:</strong> {fileLoadError}
						</p>
					</div>
				)}
			</div>
		);
	}

	// Once a project is loaded, show the main editor UI.
	const TABS: { id: EditorTab; label: string }[] = [
		{ id: "wheels", label: "Action Wheels" },
		{ id: "settings", label: "Conditional Settings" },
		{ id: "animation_nodes", label: "Animation Nodes" },
		{ id: "scripts", label: "Scripts" },
		{ id: "keybinds", label: "Keybinds" },
	];

	const renderActiveTab = () => {
		switch (activeTab) {
			case "wheels":
				return (
					<ActionWheelsManager
						addActionWheel={addActionWheel}
						viewedWheelUuid={viewedWheelUuid}
						setViewedWheelUuid={setViewedWheelUuid}
					/>
				);
			case "settings":
				return <AnimationSettingsManager />;
			case "animation_nodes":
				return <AnimationNodesManager />;
			case "scripts":
				return <ScriptsManager />;
			case "keybinds":
				return <KeybindsManager />;
			default:
				return null;
		}
	};

	return (
		<div
			className="text-slate-100 h-screen flex flex-col bg-slate-900"
			style={{ fontFamily: "'Inter', sans-serif" }}
		>
			<header className="flex justify-between items-center p-2 px-4 border-b border-slate-800 flex-shrink-0 z-20 bg-slate-900/70 backdrop-blur-lg">
				<h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-500">
					Avatar Editor
				</h1>
				<div className="flex items-center gap-2">
					<Button
						onClick={() => undo()}
						disabled={pastStates.length === 0}
						className="bg-slate-600 hover:bg-slate-500 focus-visible:ring-slate-400"
					>
						Undo
					</Button>
					<Button
						onClick={() => redo()}
						disabled={futureStates.length === 0}
						className="bg-slate-600 hover:bg-slate-500 focus-visible:ring-slate-400"
					>
						Redo
					</Button>
					<Button
						onClick={() => setMetadataEditorOpen(true)}
						className="bg-slate-600 hover:bg-slate-500 focus-visible:ring-slate-400"
					>
						Edit Metadata
					</Button>
					<Button
						onClick={saveAvatar}
						disabled={isSaving || pastStates.length === 0}
						className="bg-violet-600 hover:bg-violet-500 text-base py-2 px-6 focus-visible:ring-violet-400"
					>
						{isSaving ? "Saving..." : "Save Project"}
					</Button>
				</div>
			</header>

			<main className="flex-grow min-h-0 flex flex-col">
				{/* Tab Navigation */}
				<div className="flex-shrink-0 flex border-b border-slate-700 bg-slate-900/70 backdrop-blur-lg overflow-x-auto">
					{TABS.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`flex-shrink-0 py-3 px-5 text-center text-sm font-semibold transition-colors duration-200 border-b-2 ${
								activeTab === tab.id
									? "border-violet-500 text-white"
									: "border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* Tab Content */}
				<div className="flex-grow overflow-y-auto p-4 md:p-6 bg-slate-800/40">
					{renderActiveTab()}
				</div>
			</main>

			{isMetadataEditorOpen && (
				<MetadataEditorDialog
					isOpen={isMetadataEditorOpen}
					onClose={() => setMetadataEditorOpen(false)}
				/>
			)}
		</div>
	);
}

export default App;
