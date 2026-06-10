import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { CourseStatus } from '../types';
import { Menu, Sun, Moon, Keyboard, Wifi, WifiOff, Loader } from 'lucide-react';
import { useShortcutsStore } from './KeyboardShortcuts';
import { lectureHub, signalR } from '../services/signalr';
import { toast } from '../services/toast';

const CONNECTION_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  Connected: { label: 'Live', className: 'ws-connected' },
  Disconnected: { label: 'Offline', className: 'ws-disconnected' },
  Reconnecting: { label: 'Reconnecting...', className: 'ws-reconnecting' },
  Connecting: { label: 'Connecting...', className: 'ws-reconnecting' },
};

export const Header: React.FC = () => {
  const { activeLecture, updateLectureStatus, toggleSidebar, lectures, setActiveLecture } = useAppStore();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark';
  });
  const [wsState, setWsState] = useState<string>('Disconnected');
  const { toggle: toggleShortcuts } = useShortcutsStore();

  // Persist theme to localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') root.classList.add('light');
    else root.classList.remove('light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Initialize SignalR on mount
  useEffect(() => {
    lectureHub.init();
    lectureHub.start();

    const unsub = lectureHub.onConnectionStateChange((state) => {
      const stateStr = signalR.HubConnectionState[state];
      setWsState(stateStr);
      if (state === signalR.HubConnectionState.Connected) {
        toast.success('Connected', 'Real-time sync is active', 2000);
      } else if (state === signalR.HubConnectionState.Disconnected) {
        toast.warning('Offline', 'Real-time sync disconnected. Working in offline mode.', 4000);
      }
    });

    return () => {
      unsub();
    };
  }, []);

  // Join lecture room when active lecture changes
  useEffect(() => {
    if (activeLecture) {
      lectureHub.joinRoom(activeLecture.id);
    }
  }, [activeLecture?.id]);

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+/ = toggle shortcuts overlay
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      toggleShortcuts();
    }

    // Arrow keys for lecture navigation (only when no input is focused)
    const isInputFocused =
      document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA';

    if (!isInputFocused && lectures.length > 0 && activeLecture) {
      const currentIdx = lectures.findIndex((l) => l.id === activeLecture.id);
      if (e.key === 'ArrowRight' && currentIdx < lectures.length - 1) {
        e.preventDefault();
        setActiveLecture(lectures[currentIdx + 1]);
      } else if (e.key === 'ArrowLeft' && currentIdx > 0) {
        e.preventDefault();
        setActiveLecture(lectures[currentIdx - 1]);
      }
    }
  }, [toggleShortcuts, lectures, activeLecture, setActiveLecture]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (activeLecture) {
      updateLectureStatus(activeLecture.id, e.target.value as CourseStatus);
    }
  };

  const wsInfo = CONNECTION_STATUS_LABELS[wsState] ?? CONNECTION_STATUS_LABELS['Disconnected'];

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-toggle-btn" onClick={toggleSidebar} aria-label="Toggle Sidebar">
          <Menu className="w-5 h-5" />
        </button>
        <div className="active-lecture-title">
          <h1>{activeLecture ? activeLecture.title : 'Select a Lecture to Start'}</h1>
          <p>{activeLecture
            ? `Lecture ${activeLecture.lectureNumber} · Master Analytical Thinking & DA With Power BI`
            : 'Master Analytical Thinking & DA With Power BI'
          }</p>
        </div>
      </div>

      <div className="header-right">
        {/* WebSocket connection indicator */}
        <div className={`ws-indicator ${wsInfo.className}`} title={`Real-time sync: ${wsState}`}>
          {wsState === 'Connected' ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : wsState === 'Reconnecting' ? (
            <Loader className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          <span>{wsInfo.label}</span>
        </div>

        {activeLecture && (
          <div className="lecture-status-control">
            <label htmlFor="status-select">Status:</label>
            <div className="custom-select-wrapper">
              <select
                id="status-select"
                className="status-select"
                value={activeLecture.status}
                onChange={handleStatusChange}
              >
                <option value="unread">Unread</option>
                <option value="reading">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        <button
          className="theme-toggle"
          onClick={toggleShortcuts}
          aria-label="Show keyboard shortcuts"
          title="Keyboard shortcuts (Ctrl+/)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        <button className="theme-toggle" onClick={() => setTheme((p) => p === 'dark' ? 'light' : 'dark')} aria-label="Toggle Theme">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};
