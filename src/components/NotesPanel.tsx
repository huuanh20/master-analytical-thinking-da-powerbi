import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PenSquare, Copy, Trash2, Check, Loader2 } from 'lucide-react';

export const NotesPanel: React.FC = () => {
  const { activeLecture, saveLectureNote } = useAppStore();
  const [noteContent, setNoteContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  
  // Track the ID of the lecture currently in state to sync on change
  const [currentLectureId, setCurrentLectureId] = useState<string | null>(null);

  // Sync state during render when the active lecture changes
  if (activeLecture && activeLecture.id !== currentLectureId) {
    setCurrentLectureId(activeLecture.id);
    setNoteContent(activeLecture.noteContent || '');
    setSaveStatus('saved');
  } else if (!activeLecture && currentLectureId !== null) {
    setCurrentLectureId(null);
    setNoteContent('');
    setSaveStatus('idle');
  }

  const activeLectureId = activeLecture?.id;

  // Debounced autosave
  useEffect(() => {
    if (!activeLectureId) return;

    // Only save if the status is marked as 'saving' (triggered by user typing)
    if (saveStatus !== 'saving') return;
    
    const delayDebounceFn = setTimeout(async () => {
      await saveLectureNote(activeLectureId, noteContent);
      setSaveStatus('saved');
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(delayDebounceFn);
  }, [noteContent, activeLectureId, saveLectureNote, saveStatus]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteContent(e.target.value);
    setSaveStatus('saving');
  };

  const handleCopyNotes = async () => {
    if (!noteContent) return;
    try {
      await navigator.clipboard.writeText(noteContent);
      alert('Notes copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleClearNotes = () => {
    if (window.confirm('Are you sure you want to clear your notes for this lecture?')) {
      setNoteContent('');
      setSaveStatus('saving');
    }
  };

  if (!activeLecture || activeLecture.status === 'unread') {
    return (
      <div className="notes-panel card glass-effect">
        <div className="panel-header">
          <span className="panel-title">
            <PenSquare className="w-4 h-4 text-indigo-500" />
            Study Notes
          </span>
        </div>
        <div className="panel-body">
          <div className="notes-placeholder">
            Notes will become available once you start studying this lecture.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notes-panel card glass-effect">
      <div className="panel-header">
        <span className="panel-title">
          <PenSquare className="w-4 h-4" />
          Study Notes
        </span>
        <div className="notes-actions">
          {saveStatus === 'saving' && (
            <span className="save-status saving">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="save-status saved">
              <Check className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
          
          <button
            onClick={handleCopyNotes}
            className="action-btn"
            title="Copy Notes"
            disabled={!noteContent}
            aria-label="Copy Notes"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearNotes}
            className="action-btn"
            title="Clear Notes"
            disabled={!noteContent}
            aria-label="Clear Notes"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="panel-body notes-container">
        <textarea
          value={noteContent}
          onChange={handleContentChange}
          placeholder="Write down your key learnings, code snippets, or ideas for this lecture... (Autosaves automatically)"
        />
      </div>
    </div>
  );
};
