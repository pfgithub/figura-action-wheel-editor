import { useState, useEffect, useCallback } from "react";
import type { Avatar } from "../types";

export type UpdateAvatarFn = (updater: (draft: Avatar) => void) => void;

export function useAvatar() {
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/project.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setAvatar(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = useCallback(async () => {
    if (!avatar) return;
    setIsSaving(true);
    try {
      const response = await fetch("/project.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(avatar, null, 2),
      });
      if (!response.ok) throw new Error(`Failed to save: ${response.statusText}`);
      alert("Saved successfully!");
    } catch (err: any) {
      alert(`Error saving: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [avatar]);

  const updateAvatar: UpdateAvatarFn = useCallback((updater) => {
    setAvatar((prev) => {
      if (!prev) return null;
      const newAvatar = JSON.parse(JSON.stringify(prev)); // Deep copy
      updater(newAvatar);
      return newAvatar;
    });
  }, []);

  return {
    avatar,
    loading,
    error,
    isSaving,
    handleSave,
    updateAvatar,
  };
}