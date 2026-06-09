import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PDFViewer } from './components/PDFViewer';
import { NotesPanel } from './components/NotesPanel';
import { AlertCircle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const { fetchLectures, error, isLoading } = useAppStore();

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Workspace */}
      <main className="main-content">
        {/* Header Bar */}
        <Header />

        {/* Error Banner */}
        {error && (
          <div className="error-banner">
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

        {/* Loading Overlay */}
        {isLoading && lecturesLoadingPlaceholder()}

        {/* Workspace: PDF & Notes Panels */}
        {!isLoading && (
          <section className="workspace">
            <PDFViewer />
            <NotesPanel />
          </section>
        )}
      </main>

      {/* SVG Gradients definitions for Lucide Icons */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="indigo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

const lecturesLoadingPlaceholder = () => (
  <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '15px', color: 'var(--text-muted)' }}>
    <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading lectures data...</span>
  </div>
);

export default App;
