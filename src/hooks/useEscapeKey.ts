import { useEffect } from 'react';

/**
 * Custom hook to trigger a callback when the Escape key is pressed.
 * @param isOpen - whether the modal/component is currently active
 * @param onEscape - callback to close or dismiss
 */
export function useEscapeKey(isOpen: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onEscape]);
}
