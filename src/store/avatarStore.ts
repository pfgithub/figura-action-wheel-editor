import { create } from 'zustand';
import { temporal } from 'zundo';
import { produce, WritableDraft } from 'immer';
import type { Avatar } from '../types';

export type AvatarUpdater = (draft: WritableDraft<Avatar>) => void;

interface AvatarState {
  avatar: Avatar | null;
  loading: boolean;
  error: string | null;
  isSaving: boolean;
  fetchAvatar: () => Promise<void>;
  saveAvatar: () => Promise<void>;
  updateAvatar: (updater: AvatarUpdater) => void;
}

export const useAvatarStore = create<AvatarState>()(
  temporal(
    (set, get) => ({
      // --- State ---
      avatar: null,
      loading: true,
      error: null,
      isSaving: false,

      // --- Actions ---
      fetchAvatar: async () => {
        try {
          set({ loading: true, error: null });
          const res = await fetch('/project.json');
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const data = await res.json();
          set({ avatar: data, loading: false });
          // After fetching fresh data, clear the local undo/redo history.
          useAvatarStore.temporal.getState().clear();
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      saveAvatar: async () => {
        const { avatar } = get();
        if (!avatar) return;
        set({ isSaving: true });
        try {
          const response = await fetch('/project.json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(avatar, null, 2),
          });
          if (!response.ok) throw new Error(`Failed to save: ${response.statusText}`);
          alert('Saved successfully!');
          // After a successful save, clear the undo history as it represents "unsaved" changes.
          // useAvatarStore.temporal.clear();
        } catch (err: any) {
          alert(`Error saving: ${err.message}`);
        } finally {
          set({ isSaving: false });
        }
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