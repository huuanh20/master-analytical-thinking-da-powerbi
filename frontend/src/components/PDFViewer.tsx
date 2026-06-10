import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FileText, Download, Expand, Shrink, BookOpen, Play, Loader2 } from 'lucide-react';
import { toast } from '../services/toast';

export const PDFViewer: React.FC = () => {
  const { activeLecture, updateLectureStatus } = useAppStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  const toggleFullscreen = () => setIsFullscreen((f) => !f);

  const handleStartLearning = () => {
    if (activeLecture) {
      updateLectureStatus(activeLecture.id, 'reading');
      toast.success('Started!', `Now studying ${activeLecture.title}`, 2000);
    }
  };

  // Show loading when PDF changes
  useEffect(() => {
    if (activeLecture && activeLecture.status !== 'unread') {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [activeLecture?.id]);

  // Keyboard shortcuts for PDF viewer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA';
      if (isInputFocused) return;

      // F = toggle fullscreen
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsFullscreen((f) => !f);
      }
      // D = download PDF
      if ((e.key === 'd' || e.key === 'D') && activeLecture && activeLecture.status !== 'unread') {
        e.preventDefault();
        downloadRef.current?.click();
      }
      // Escape = exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeLecture, isFullscreen]);

  if (!activeLecture) {
    return (
      <div className="viewer-panel card glass-effect">
        <div className="panel-header">
          <span className="panel-title">
            <FileText className="w-4 h-4 text-indigo-500" />
            Document Viewer
          </span>
        </div>
        <div className="panel-body pdf-container">
          <div className="welcome-screen">
            <div className="welcome-icon">
              <BookOpen className="w-16 h-16" style={{ stroke: 'url(#indigo-grad)' }} />
            </div>
            <h3>Welcome to Your Learning Workspace</h3>
            <p>Select any lecture from the sidebar to load the study materials, track your progress, and take rich notes.</p>
            <div className="welcome-tips">
              <div className="welcome-tip">
                <span className="kbd">←</span> <span className="kbd">→</span> Navigate lectures
              </div>
              <div className="welcome-tip">
                <span className="kbd">F</span> Toggle fullscreen
              </div>
              <div className="welcome-tip">
                <span className="kbd">N</span> Focus notes
              </div>
              <div className="welcome-tip">
                <span className="kbd">Ctrl</span>+<span className="kbd">/</span> All shortcuts
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const apiBaseUrl = import.meta.env.VITE_API_URL || '';
  const pdfUrl = activeLecture.filePath.startsWith('/api')
    ? `${apiBaseUrl}${activeLecture.filePath}`
    : activeLecture.filePath;

  return (
    <div className={`viewer-panel card glass-effect ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="panel-header">
        <span className="panel-title">
          <FileText className="w-4 h-4" />
          {activeLecture.fileName}
        </span>
        <div className="viewer-actions">
          {activeLecture.status !== 'unread' && (
            <>
              <a
                ref={downloadRef}
                href={pdfUrl}
                className="action-btn"
                download={activeLecture.fileName}
                title="Download PDF (D)"
                aria-label="Download PDF"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={toggleFullscreen}
                className="action-btn"
                title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen (F)'}
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Shrink className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="panel-body pdf-container" style={{ padding: 0, position: 'relative' }}>
        {activeLecture.status === 'unread' ? (
          <div className="welcome-screen">
            <div className="welcome-icon">
              <FileText className="w-16 h-16" style={{ color: 'var(--color-primary)' }} />
            </div>
            <h3>Ready to Start {activeLecture.lectureNumber}?</h3>
            <p>This lecture is marked as Unread. Click below to open the PDF and begin taking notes.</p>
            <button className="btn btn-primary start-btn" onClick={handleStartLearning}>
              <Play className="w-4 h-4" />
              Start Learning
            </button>
          </div>
        ) : (
          <>
            {/* Loading skeleton overlay */}
            {isLoading && (
              <div className="pdf-loading-overlay">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
                <span>Loading PDF...</span>
              </div>
            )}
            <iframe
              key={activeLecture.id}
              src={`${pdfUrl}#toolbar=1`}
              className="pdf-iframe"
              title={activeLecture.title}
              onLoad={() => setIsLoading(false)}
            />
          </>
        )}
      </div>
    </div>
  );
};
