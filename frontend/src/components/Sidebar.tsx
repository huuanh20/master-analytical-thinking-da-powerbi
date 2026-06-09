import React from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Lecture, CourseStatus } from '../types';
import { Search, GraduationCap, ChevronLeft, CheckCircle2, Circle, PlayCircle } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    lectures,
    activeLecture,
    searchTerm,
    filter,
    isSidebarOpen,
    setSearchTerm,
    setFilter,
    setActiveLecture,
    toggleSidebar,
  } = useAppStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const getStatusIcon = (status: CourseStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 status-completed" style={{ color: 'var(--color-success)' }} />;
      case 'reading':
        return <PlayCircle className="w-4 h-4 text-amber-500 status-reading" style={{ color: 'var(--color-warning)' }} />;
      default:
        return <Circle className="w-4 h-4 text-gray-500 status-unread" style={{ color: 'var(--text-dim)' }} />;
    }
  };

  // Filter and search logic
  const filteredLectures = lectures.filter((lecture) => {
    const matchesSearch =
      lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lecture.lectureNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearch;
    return matchesSearch && lecture.status === filter;
  });

  // Calculate progress stats
  const totalLectures = lectures.length;
  const completedLectures = lectures.filter((l) => l.status === 'completed').length;
  const progressPercent = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

  return (
    <aside className={`sidebar ${isSidebarOpen ? '' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">
            <GraduationCap className="w-6 h-6" />
          </span>
          <div className="logo-text">
            <h2>Power BI</h2>
            <span>Mastery Portal</span>
          </div>
        </div>
        <button className="close-sidebar-btn" onClick={toggleSidebar} aria-label="Close Sidebar">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Summary Card */}
      <div className="progress-card">
        <div className="progress-card-header">
          <span>Overall Progress</span>
          <span className="progress-percent">{progressPercent}%</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div className="progress-stats">
          <span>{completedLectures}/{totalLectures} Completed</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="search-filter-wrapper">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search lectures..."
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Search lectures"
          />
        </div>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
          <button
            className={`filter-tab ${filter === 'reading' ? 'active' : ''}`}
            onClick={() => setFilter('reading')}
          >
            Study
          </button>
          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Done
          </button>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="lecture-nav">
        <ul className="lecture-list">
          {filteredLectures.map((lecture) => {
            const isActive = activeLecture?.id === lecture.id;
            return (
              <li
                key={lecture.id}
                className={`lecture-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveLecture(lecture)}
              >
                <div className="lecture-item-left">
                  <div className="lecture-badge">{lecture.lectureNumber}</div>
                  <div className="lecture-info">
                    <span className="lecture-title-text" title={lecture.title}>
                      {lecture.title}
                    </span>
                    <span className="lecture-meta">Lecture File</span>
                  </div>
                </div>
                {getStatusIcon(lecture.status)}
              </li>
            );
          })}
          {filteredLectures.length === 0 && (
            <li className="lecture-placeholder-text" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No lectures found
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
};
