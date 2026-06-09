import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { CourseStatus } from '../types';
import { Menu, Sun, Moon } from 'lucide-react';

export const Header: React.FC = () => {
  const { activeLecture, updateLectureStatus, toggleSidebar } = useAppStore();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Sync theme class on body
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [theme]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (activeLecture) {
      updateLectureStatus(activeLecture.id, e.target.value as CourseStatus);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-toggle-btn" onClick={toggleSidebar} aria-label="Toggle Sidebar">
          <Menu className="w-5 h-5" />
        </button>
        <div className="active-lecture-title">
          <h1>{activeLecture ? activeLecture.title : 'Select a Lecture to Start'}</h1>
          <p>{activeLecture ? `Lecture Number: ${activeLecture.lectureNumber}` : 'Master Analytical Thinking & DA With Power BI'}</p>
        </div>
      </div>

      <div className="header-right">
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

        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};
