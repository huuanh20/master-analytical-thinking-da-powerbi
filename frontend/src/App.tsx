import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PDFViewer } from './components/PDFViewer';
import { NotesPanel } from './components/NotesPanel';
import { ToastContainer } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { ResizablePanels } from './components/ResizablePanels';
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const { fetchLectures, error, isLoading } = useAppStore();

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  return (
    <>
      <div className="app-container">
        {/* Animated background */}
        <div className="bg-ambient" aria-hidden="true">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="bg-orb bg-orb-3" />
        </div>

        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Workspace */}
        <main className="main-content">
          {/* Header Bar */}
          <Header />

          {/* Error Banner */}
          {error && (
            <div className="error-banner" role="alert">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => fetchLectures()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}
                title="Retry fetching data"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', color: 'var(--text-muted)' }}>
              <div className="loading-pulse">
                <BookOpen className="w-10 h-10" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Loading your lectures...</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Connecting to the learning portal</div>
              </div>
            </div>
          )}

          {/* Workspace: Resizable PDF & Notes Panels */}
          {!isLoading && (
            <section className="workspace">
              <ResizablePanels
                left={<PDFViewer />}
                right={<NotesPanel />}
                defaultRatio={0.62}
                minLeftWidth={360}
                minRightWidth={280}
                storageKey="powerbi-panel-ratio"
              />
            </section>
          )}
        </main>

        {/* SVG Gradient definitions for icons */}
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          <defs>
            <linearGradient id="indigo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Global overlays (rendered outside app-container for proper z-index stacking) */}
      <ToastContainer />
      <ConfirmDialog />
      <KeyboardShortcuts />
    </>
  );
};

export default App;
