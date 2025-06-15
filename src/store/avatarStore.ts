import { create } from 'zustand';
import { temporal } from 'zundo';
import { produce, WritableDraft } from 'immer';
import type { Avatar, AnimationID } from '../types';
import { generateLua } from '../../generateLua';

export type AvatarUpdater = (draft: WritableDraft<Avatar>) => void;

interface AvatarState {
  avatar: Avatar | null;
  animations: AnimationID[];
  isSaving: boolean;
  loadAvatar: (data: Avatar, animations: AnimationID[]) => void;
  saveAvatar: () => void;
  updateAvatar: (updater: AvatarUpdater) => void;
  clearAvatar: () => void;
}

export const useAvatarStore = create<AvatarState>()(
  temporal(
    (set, get) => ({
      // --- State ---
      avatar: null,
      animations: [],
      isSaving: false,

      // --- Actions ---
      loadAvatar: (data, animations) => {
        set({ avatar: data, animations });
        // After loading a new project, clear the undo/redo history.
        useAvatarStore.temporal.getState().clear();
      },

      saveAvatar: () => {
        const { avatar } = get();
        if (!avatar) return;

        set({ isSaving: true });
        try {
          const avatarLua = generateLua(avatar);
          const blob = new Blob([avatarLua], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'project.figura-editor.lua';
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

      clearAvatar: () => {
        set({ avatar: null, animations: [] });
        useAvatarStore.temporal.getState().clear();
      },

      updateAvatar: (updater) => {
        set(
          produce((state: AvatarState) => {
            if (state.avatar) {
              updater(state.avatar);
            }
          })
        );
      },
    }),
    {
      // Only track the 'avatar' property in the undo/redo history.
      partialize: (state) => ({ avatar: state.avatar }),
      // Limit the number of history entries
      limit: 100,
    }
  )
);