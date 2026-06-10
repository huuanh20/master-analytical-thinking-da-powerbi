import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  PenSquare, Copy, Trash2, Check, Loader2, Eye, Code,
  Bold, Italic, List, Hash, Minus, Save
} from 'lucide-react';
import { toast } from '../services/toast';
import { confirm } from './ConfirmDialog';
import { lectureHub } from '../services/signalr';

// Simple markdown to HTML converter (no external deps)
// Escapes raw HTML first to prevent XSS via <script> tags in notes
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function markdownToHtml(md: string): string {
  // Split into code blocks and non-code parts to escape HTML only in non-code
  const parts = md.split(/(```[\s\S]*?```)/g);
  const processed = parts.map((part, i) => {
    if (i % 2 === 1) {
      // Code block — preserve but escape HTML inside
      const inner = part.slice(3, -3);
      return `<pre><code>${escapeHtml(inner)}</code></pre>`;
    }
    // Normal text — escape HTML then apply markdown
    return escapeHtml(part)
      // Inline code
      .replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`)
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr />')
      // Unordered lists
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      // Ordered lists (basic)
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      // Paragraph breaks
      .replace(/\n\n/g, '</p><p>');
  });
  return processed.join('');
}


export const NotesPanel: React.FC = () => {
  const { activeLecture, saveLectureNote } = useAppStore();
  const [noteContent, setNoteContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [currentLectureId, setCurrentLectureId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync note content when active lecture changes
  if (activeLecture && activeLecture.id !== currentLectureId) {
    setCurrentLectureId(activeLecture.id);
    setNoteContent(activeLecture.noteContent || '');
    setSaveStatus('saved');
    setIsPreviewMode(false);
  } else if (!activeLecture && currentLectureId !== null) {
    setCurrentLectureId(null);
    setNoteContent('');
    setSaveStatus('idle');
  }

  const activeLectureId = activeLecture?.id;

  // Debounced autosave with 1s delay
  useEffect(() => {
    if (!activeLectureId || saveStatus !== 'saving') return;
    const timer = setTimeout(async () => {
      try {
        await saveLectureNote(activeLectureId, noteContent);
        // Broadcast to other tabs/clients via SignalR
        lectureHub.broadcastNoteUpdate(activeLectureId, noteContent);
        setSaveStatus('saved');
        toast.success('Notes saved', undefined, 1500);
      } catch {
        toast.error('Save failed', 'Could not save notes. Will retry...');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [noteContent, activeLectureId, saveLectureNote, saveStatus]);

  // Listen for note updates from other clients
  useEffect(() => {
    if (!activeLectureId) return;
    const unsub = lectureHub.onNoteUpdated(({ lectureId, content }) => {
      if (lectureId === activeLectureId) {
        setNoteContent(content);
        setSaveStatus('saved');
        toast.info('Notes synced', 'Updated from another tab');
      }
    });
    return unsub;
  }, [activeLectureId]);

  // Keyboard shortcut: N = focus notes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === 'n' &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        textareaRef.current?.focus();
      }
      // Ctrl+S = force save
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && activeLectureId) {
        e.preventDefault();
        if (saveStatus === 'saving') {
          saveLectureNote(activeLectureId, noteContent).then(() => {
            setSaveStatus('saved');
            toast.success('Notes saved!', undefined, 1500);
          });
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeLectureId, noteContent, saveLectureNote, saveStatus]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteContent(e.target.value);
    setSaveStatus('saving');
  };

  const handleCopyNotes = async () => {
    if (!noteContent) return;
    try {
      await navigator.clipboard.writeText(noteContent);
      toast.success('Copied!', 'Notes copied to clipboard');
    } catch {
      toast.error('Copy failed', 'Could not access clipboard');
    }
  };

  const handleClearNotes = async () => {
    const confirmed = await confirm({
      title: 'Clear Notes',
      message: `Are you sure you want to clear your notes for "${activeLecture?.title}"? This cannot be undone.`,
      confirmText: 'Clear Notes',
      cancelText: 'Keep Notes',
      variant: 'danger',
    });
    if (confirmed) {
      setNoteContent('');
      setSaveStatus('saving');
    }
  };

  // Markdown toolbar helpers
  const insertMarkdown = useCallback((prefix: string, suffix = '', placeholder = 'text') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = noteContent.slice(start, end) || placeholder;
    const newContent =
      noteContent.slice(0, start) + prefix + selected + suffix + noteContent.slice(end);
    setNoteContent(newContent);
    setSaveStatus('saving');
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  }, [noteContent]);

  const wordCount = noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0;
  const charCount = noteContent.length;

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
            <PenSquare className="w-8 h-8" style={{ marginBottom: '12px', opacity: 0.3 }} />
            <span>Notes will be available once you start studying this lecture.</span>
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

          {/* Preview Toggle */}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`action-btn ${isPreviewMode ? 'active-action' : ''}`}
            title={isPreviewMode ? 'Edit mode' : 'Preview markdown'}
            aria-label="Toggle preview"
          >
            {isPreviewMode ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            onClick={handleCopyNotes}
            className="action-btn"
            title="Copy notes"
            disabled={!noteContent}
            aria-label="Copy notes"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearNotes}
            className="action-btn action-btn-danger"
            title="Clear notes"
            disabled={!noteContent}
            aria-label="Clear notes"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Markdown Toolbar */}
      {!isPreviewMode && (
        <div className="markdown-toolbar">
          <button className="md-btn" onClick={() => insertMarkdown('**', '**', 'bold text')} title="Bold (Ctrl+B)">
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button className="md-btn" onClick={() => insertMarkdown('*', '*', 'italic text')} title="Italic">
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button className="md-btn" onClick={() => insertMarkdown('`', '`', 'code')} title="Inline code">
            <Code className="w-3.5 h-3.5" />
          </button>
          <div className="md-divider" />
          <button className="md-btn" onClick={() => insertMarkdown('# ', '', 'Heading')} title="Heading 1">
            <Hash className="w-3.5 h-3.5" />
          </button>
          <button className="md-btn" onClick={() => insertMarkdown('## ', '', 'Heading 2')} title="Heading 2">
            <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>H2</span>
          </button>
          <div className="md-divider" />
          <button className="md-btn" onClick={() => insertMarkdown('\n- ', '', 'list item')} title="Bullet list">
            <List className="w-3.5 h-3.5" />
          </button>
          <button className="md-btn" onClick={() => insertMarkdown('\n---\n')} title="Horizontal divider">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <div className="md-divider" />
          <button className="md-btn" onClick={() => insertMarkdown('```\n', '\n```', 'code block')} title="Code block">
            <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{ }</span>
          </button>
        </div>
      )}

      <div className="panel-body notes-container">
        {isPreviewMode ? (
          <div
            className="markdown-preview"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(noteContent) || '<p style="opacity:0.4;font-size:0.85rem">Nothing to preview yet...</p>' }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={noteContent}
            onChange={handleContentChange}
            placeholder={`Write your notes for ${activeLecture.title}...\n\nMarkdown supported: **bold**, *italic*, \`code\`, # Headings, - Lists\n\n(Auto-saves after 1s. Press N to focus, Ctrl+S to force save)`}
          />
        )}
      </div>

      {/* Word & char count footer */}
      <div className="notes-footer">
        <span>{wordCount} words</span>
        <span>·</span>
        <span>{charCount} chars</span>
        {saveStatus === 'saving' && (
          <>
            <span>·</span>
            <Save className="w-3 h-3 animate-pulse" />
          </>
        )}
      </div>
    </div>
  );
};
