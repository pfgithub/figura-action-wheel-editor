import { produce, type WritableDraft } from "immer";
import { temporal } from "zundo";
import { create } from "zustand";
import { generateLua } from "@/data/generateLua";
import type {
	ActionEffect,
	AnimationRef,
	Avatar,
	AvatarMetadata,
	ModelPartRef,
	TextureAsset,
} from "@/types";
import { generateUUID } from "@/utils/uuid";

export type AvatarUpdater = (draft: WritableDraft<Avatar>) => void;
export type MetadataUpdater = (draft: WritableDraft<AvatarMetadata>) => void;

interface AvatarState {
	avatar: Avatar | null;
	metadata: AvatarMetadata | null;
	animations: AnimationRef[];
	modelElements: ModelPartRef[];
	textures: TextureAsset[];
	isSaving: boolean;
	loadAvatar: (
		data: Avatar,
		animations: AnimationRef[],
		modelElements: ModelPartRef[],
		textures: TextureAsset[],
		metadata: AvatarMetadata,
	) => void;
	saveAvatar: () => void;
	saveMetadata: () => void;
	updateAvatar: (updater: AvatarUpdater) => void;
	updateMetadata: (updater: MetadataUpdater) => void;
	clearAvatar: () => void;
}

export const useAvatarStore = create<AvatarState>()(
	temporal(
		(set, get) => ({
			// --- State ---
			avatar: null,
			metadata: null,
			animations: [],
			modelElements: [],
			textures: [],
			isSaving: false,

			// --- Actions ---
			loadAvatar: (data, animations, modelElements, textures, metadata) => {
				// --- MIGRATION LOGIC for ActionEffect array ---
				const migrateEffects = (item: {
					effect?: ActionEffect | ActionEffect[];
					effects?: ActionEffect[];
				}) => {
					const oldEffect = (item as any).effect;
					// If `effect` exists and `effects` doesn't, we need to migrate.
					if (oldEffect && !(item as any).effects) {
						if (!Array.isArray(oldEffect)) {
							// Single object -> array with one object
							const effectWithId = oldEffect as ActionEffect;
							if (!effectWithId.id) effectWithId.id = generateUUID();
							(item as any).effects = [effectWithId];
						} else {
							// It was an array under the old key, just move it.
							(item as any).effects = oldEffect;
						}
						delete (item as any).effect;
					}
					// Ensure all effects in the array have a UUID for D&D keys.
					if ((item as any).effects) {
						(item as any).effects.forEach((e: ActionEffect) => {
							if (!e.id) e.id = generateUUID();
						});
					}
				};

				for (const wheel of Object.values(data.actionWheels)) {
					for (const action of wheel.actions) {
						migrateEffects(action);
					}
				}
				if (data.keybinds) {
					for (const keybind of Object.values(data.keybinds)) {
						migrateEffects(keybind);
					}
				}
				// --- END MIGRATION LOGIC ---

				set({ avatar: data, animations, modelElements, textures, metadata });
				// After loading a new project, clear the undo/redo history.
				useAvatarStore.temporal.getState().clear();
			},

			saveAvatar: () => {
				const { avatar } = get();
				if (!avatar) return;

				set({ isSaving: true });
				try {
					const avatarLua = generateLua(avatar);
					const blob = new Blob([avatarLua], { type: "application/json" });
					const url = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = "project.figura-editor.lua";
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
				} catch (err: any) {
					console.error("Error saving file:", err);
					alert(`Error saving: ${err.message}`);
				} finally {
					set({ isSaving: false });
				}
			},

			saveMetadata: () => {
				const { metadata } = get();
				if (!metadata) return;
				set({ isSaving: true });
				try {
					const metadataJson = JSON.stringify(metadata, null, 4);
					const blob = new Blob([metadataJson], { type: "application/json" });
					const url = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = "avatar.json";
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
				} catch (err: any) {
					console.error("Error saving metadata:", err);
					alert(`Error saving metadata: ${err.message}`);
				} finally {
					set({ isSaving: false });
				}
			},

			clearAvatar: () => {
				set({
					avatar: null,
					metadata: null,
					animations: [],
					modelElements: [],
					textures: [],
				});
				useAvatarStore.temporal.getState().clear();
			},

			updateAvatar: (updater) => {
				set(
					produce((state: AvatarState) => {
						if (state.avatar) {
							updater(state.avatar);
						}
					}),
				);
			},

			updateMetadata: (updater) => {
				set(
					produce((state: AvatarState) => {
						if (state.metadata) {
							updater(state.metadata);
						}
					}),
				);
			},
		}),
		{
			// Track 'avatar' and 'metadata' in the undo/redo history.
			partialize: (state) => ({
				avatar: state.avatar,
				metadata: state.metadata,
			}),
			// Limit the number of history entries
			limit: 100,
		},
	),
);