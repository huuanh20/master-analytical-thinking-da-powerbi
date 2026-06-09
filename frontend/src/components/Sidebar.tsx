import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { CourseStatus } from '../types';
import { Search, GraduationCap, ChevronLeft, CheckCircle2, Circle, PlayCircle, Plus, X, FileUp } from 'lucide-react';

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
    uploadLecture,
  } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim() || !newFile) {
      setUploadError('Please fill all fields and select a PDF file.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      await uploadLecture(newTitle.trim(), newCode.trim(), newFile);
      setIsModalOpen(false);
      setNewTitle('');
      setNewCode('');
      setNewFile(null);
    } catch (err: any) {
      setUploadError('Failed to upload PDF. Please check the backend connection and ensure the Lecture Code is unique.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setUploadError('Only PDF files are supported.');
        setNewFile(null);
        return;
      }
      setNewFile(file);
      setUploadError('');
    }
  };

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

      {/* Upload button */}
      <button className="upload-btn" onClick={() => setIsModalOpen(true)}>
        <Plus className="w-4 h-4" /> Add PDF Material
      </button>

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

      {/* Upload Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                <FileUp className="w-5 h-5 text-indigo-500" />
                Add New PDF Document
              </span>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {uploadError && (
                <div style={{ color: '#f87171', fontSize: '0.82rem', padding: '8px 12px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: '6px' }}>
                  {uploadError}
                </div>
              )}
              
              <div className="form-group">
                <label>Lecture Title</label>
                <input
                  type="text"
                  placeholder="e.g. Lecture 12: Advanced Row-Level Security"
                  className="form-control"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  disabled={uploading}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Lecture Code / Number</label>
                <input
                  type="text"
                  placeholder="e.g. L12"
                  className="form-control"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  disabled={uploading}
                  required
                />
              </div>

              <div className="form-group">
                <label>PDF File</label>
                <div 
                  className="file-picker-container"
                  onClick={() => !uploading && fileInputRef.current?.click()}
                >
                  <FileUp className="w-8 h-8 text-indigo-500" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                  {newFile ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>
                      {newFile.name}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Click to choose a PDF file
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  style={{ display: 'none' }}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={uploading}
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Add Lecture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
