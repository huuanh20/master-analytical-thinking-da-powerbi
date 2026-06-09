import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PenSquare, Copy, Trash2, Check, Loader2 } from 'lucide-react';

export const NotesPanel: React.FC = () => {
  const { activeLecture, saveLectureNote } = useAppStore();
  const [noteContent, setNoteContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  
  // Track if initial load is complete to prevent saving on first render
  const isFirstRender = useRef(true);
  const activeLectureIdRef = useRef<string | null>(null);

  // Sync state when active lecture changes
  useEffect(() => {
    if (activeLecture) {
      isFirstRender.current = true;
      activeLectureIdRef.current = activeLecture.id;
      setNoteContent(activeLecture.noteContent || '');
      setSaveStatus('saved');
    } else {
      setNoteContent('');
      setSaveStatus('idle');
    }
  }, [activeLecture?.id]);

  // Debounced autosave
  useEffect(() => {
    // If it's the initial render of a newly loaded lecture, skip saving
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!activeLecture) return;

    setSaveStatus('saving');
    
    const delayDebounceFn = setTimeout(async () => {
      // Ensure we are saving notes for the correct lecture
      if (activeLectureIdRef.current === activeLecture.id) {
        await saveLectureNote(activeLecture.id, noteContent);
        setSaveStatus('saved');
      }
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(delayDebounceFn);
  }, [noteContent, activeLecture?.id]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteContent(e.target.value);
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
