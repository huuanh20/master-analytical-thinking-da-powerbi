import React, { useEffect } from 'react';
import { create } from 'zustand';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

export const useShortcutsStore = create<ShortcutsState>((set) => ({
  isOpen: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
}));

const SHORTCUTS = [
  { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts' },
  { keys: ['F'], description: 'Toggle PDF fullscreen' },
  { keys: ['D'], description: 'Download current PDF' },
  { keys: ['N'], description: 'Focus notes editor' },
  { keys: ['←', '→'], description: 'Navigate between lectures' },
  { keys: ['Esc'], description: 'Close dialogs / Exit fullscreen' },
  { keys: ['Ctrl', 'S'], description: 'Force save notes now' },
];

export const KeyboardShortcuts: React.FC = () => {
  const { isOpen, close } = useShortcutsStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      className="shortcuts-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div className="shortcuts-dialog">
        <div className="shortcuts-header">
          <div className="shortcuts-title">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </div>
          <button className="shortcuts-close" onClick={close} aria-label="Close shortcuts">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="shortcuts-list">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="shortcut-item">
              <div className="shortcut-keys">
                {s.keys.map((k, ki) => (
                  <React.Fragment key={ki}>
                    <kbd className="kbd">{k}</kbd>
                    {ki < s.keys.length - 1 && <span className="kbd-plus">+</span>}
                  </React.Fragment>
                ))}
              </div>
              <span className="shortcut-desc">{s.description}</span>
            </div>
          ))}
        </div>
        <div className="shortcuts-footer">
          Press <kbd className="kbd">Ctrl</kbd>+<kbd className="kbd">/</kbd> to toggle this panel
        </div>
      </div>
    </div>
  );
};
