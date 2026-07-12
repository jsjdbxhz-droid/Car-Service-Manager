import { useState, useCallback } from 'react';

type SetLocationFn = (path: string) => void;

/**
 * Manages the edit-secret gate flow.
 * Call requestEdit(path, setLocation) when the user clicks Edit.
 * If no edit code is set on the server → navigates immediately.
 * If an edit code is set → shows the dialog; on success navigates.
 */
export function useEditSecret() {
  const [editSecretOpen, setEditSecretOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [editNav, setEditNav] = useState<SetLocationFn | null>(null);

  const requestEdit = useCallback(async (path: string, navigate: SetLocationFn) => {
    // Check if edit code is enabled via dedicated public endpoint
    try {
      const base = ((import.meta.env.BASE_URL as string | undefined) ?? '').replace(/\/$/, '');
      const res = await fetch(`${base}/api/config/edit-code-enabled`);
      if (res.ok) {
        const data = (await res.json()) as { enabled: boolean };
        if (!data.enabled) {
          // No secret set — navigate directly
          navigate(path);
          return;
        }
      }
    } catch {
      // Network error — show dialog (server will validate the code)
    }
    // Secret is required — show dialog
    setEditTarget(path);
    setEditNav(() => navigate);
    setEditSecretOpen(true);
  }, []);

  const closeEditSecret = useCallback(() => {
    setEditSecretOpen(false);
    setEditTarget(null);
    setEditNav(null);
  }, []);

  const confirmEdit = useCallback(() => {
    if (editTarget && editNav) {
      editNav(editTarget);
    }
    setEditSecretOpen(false);
    setEditTarget(null);
    setEditNav(null);
  }, [editTarget, editNav]);

  return { editSecretOpen, editTarget, requestEdit, closeEditSecret, confirmEdit };
}
