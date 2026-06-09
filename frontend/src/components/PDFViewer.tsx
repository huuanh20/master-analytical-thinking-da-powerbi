import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FileText, Download, Expand, Shrink, BookOpen } from 'lucide-react';

export const PDFViewer: React.FC = () => {
  const { activeLecture, updateLectureStatus } = useAppStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleStartLearning = () => {
    if (activeLecture) {
      updateLectureStatus(activeLecture.id, 'reading');
    }
  };

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
              <BookOpen className="w-16 h-16 text-indigo-500" style={{ stroke: 'url(#indigo-grad)' }} />
            </div>
            <h3>Welcome to Your Learning Workspace</h3>
            <p>Select any lecture from the sidebar to load the study materials, track your progress, and take notes.</p>
          </div>
        </div>
      </div>
    );
  }

  // File path resolved relative to the web application origin
  const pdfUrl = `${activeLecture.filePath}`;

  return (
    <div className={`viewer-panel card glass-effect ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="panel-header">
        <span className="panel-title">
          <FileText className="w-4 h-4" />
          {activeLecture.fileName}
        </span>
        <div className="viewer-actions">
          <a
            href={pdfUrl}
            className="action-btn"
            download={activeLecture.fileName}
            title="Download PDF"
            aria-label="Download PDF"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={toggleFullscreen}
            className="action-btn"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Shrink className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="panel-body pdf-container" style={{ padding: 0 }}>
        {activeLecture.status === 'unread' ? (
          <div className="welcome-screen">
            <div className="welcome-icon">
              <FileText className="w-16 h-16 text-indigo-500" />
            </div>
            <h3>Ready to Start {activeLecture.lectureNumber}?</h3>
            <p>This lecture is marked as Unread. Click start learning to open the PDF and begin taking notes.</p>
            <button className="btn btn-primary" onClick={handleStartLearning}>
              Start Learning
            </button>
          </div>
        ) : (
          <iframe
            key={activeLecture.id} // Forces iframe reload when lecture changes
            src={`${pdfUrl}#toolbar=1`}
            className="pdf-iframe"
            title={activeLecture.title}
          />
        )}
      </div>
    </div>
  );
};
