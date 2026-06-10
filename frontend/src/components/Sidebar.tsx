import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { CourseStatus } from '../types';
import {
  Search, GraduationCap, ChevronLeft, CheckCircle2, Circle, PlayCircle,
  Plus, X, FileUp, Trash2, BookOpen, TrendingUp
} from 'lucide-react';
import { toast } from '../services/toast';
import { confirm } from './ConfirmDialog';

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
    deleteLecture,
  } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteClick = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Lecture',
      message: `Are you sure you want to permanently delete "${title}"? The PDF and all notes will be removed.`,
      confirmText: 'Delete Permanently',
      cancelText: 'Keep Lecture',
      variant: 'danger',
    });
    if (confirmed) {
      try {
        await deleteLecture(id);
        toast.success('Lecture deleted', `"${title}" has been removed`);
      } catch {
        toast.error('Delete failed', 'Could not delete the lecture. Please try again.');
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim() || !newFile) {
      setUploadError('Please fill all fields and select a PDF file.');
      return;
    }
    setUploading(true);
    setUploadError('');
    setUploadProgress(0);

    // Simulate progress for UX (real upload doesn't expose progress easily with axios here)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 15, 85));
    }, 300);

    try {
      await uploadLecture(newTitle.trim(), newCode.trim(), newFile);
      setUploadProgress(100);
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsModalOpen(false);
        setNewTitle('');
        setNewCode('');
        setNewFile(null);
        setUploadProgress(0);
      }, 400);
      toast.success('Lecture added!', `"${newTitle}" is now available in your library`);
    } catch {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setUploadError('Upload failed. Please check the backend is running and Lecture Code is unique.');
      toast.error('Upload failed', 'Check that the Lecture Code is unique and backend is running.');
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
      if (file.size > 52_428_800) {
        setUploadError('PDF must be smaller than 50 MB.');
        setNewFile(null);
        return;
      }
      setNewFile(file);
      setUploadError('');
    }
  };

  const getStatusIcon = (status: CourseStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-success)' }} />;
      case 'reading':
        return <PlayCircle className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />;
      default:
        return <Circle className="w-4 h-4" style={{ color: 'var(--text-dim)' }} />;
    }
  };

  const filteredLectures = lectures.filter((lecture) => {
    const matchesSearch =
      lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lecture.lectureNumber.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'all') return matchesSearch;
    return matchesSearch && lecture.status === filter;
  });

  const totalLectures = lectures.length;
  const completedLectures = lectures.filter((l) => l.status === 'completed').length;
  const readingLectures = lectures.filter((l) => l.status === 'reading').length;
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

      {/* Enhanced Progress Card */}
      <div className="progress-card">
        <div className="progress-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
            <span>Overall Progress</span>
          </div>
          <span className="progress-percent">{progressPercent}%</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="progress-stats">
          <span>
            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{completedLectures}</span> done
            {' · '}
            <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>{readingLectures}</span> in progress
            {' · '}
            {totalLectures} total
          </span>
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
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search lectures"
          />
          {searchTerm && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="filter-tabs">
          {(['all', 'unread', 'reading', 'completed'] as const).map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'unread' ? 'New' : f === 'reading' ? 'Active' : 'Done'}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Button */}
      <button className="upload-btn" onClick={() => setIsModalOpen(true)}>
        <Plus className="w-4 h-4" /> Add PDF Material
      </button>

      {/* Lecture List */}
      <nav className="lecture-nav">
        <ul className="lecture-list">
          {filteredLectures.map((lecture) => {
            const isActive = activeLecture?.id === lecture.id;
            return (
              <li
                key={lecture.id}
                className={`lecture-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveLecture(lecture)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setActiveLecture(lecture);
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="lecture-item-left">
                  <div className="lecture-badge">{lecture.lectureNumber}</div>
                  <div className="lecture-info">
                    <span className="lecture-title-text" title={lecture.title}>
                      {lecture.title}
                    </span>
                    <span className="lecture-meta">
                      {lecture.sizeBytes > 0
                        ? `${(lecture.sizeBytes / 1024 / 1024).toFixed(1)} MB`
                        : 'PDF file'
                      }
                      {lecture.noteContent ? ' · Has notes' : ''}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getStatusIcon(lecture.status)}
                  <button
                    className="delete-item-btn"
                    onClick={(e) => handleDeleteClick(e, lecture.id, lecture.title)}
                    title="Delete Lecture"
                    aria-label={`Delete ${lecture.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
          {filteredLectures.length === 0 && (
            <li className="lecture-placeholder-text" style={{ padding: '32px 20px', textAlign: 'center' }}>
              <BookOpen className="w-8 h-8" style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                {searchTerm ? `No lectures match "${searchTerm}"` : 'No lectures found'}
              </div>
            </li>
          )}
        </ul>
      </nav>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !uploading && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                <FileUp className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                Add New PDF Lecture
              </span>
              <button
                className="modal-close"
                onClick={() => !uploading && setIsModalOpen(false)}
                disabled={uploading}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {uploadError && (
                <div className="upload-error-msg">{uploadError}</div>
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
                <label>Lecture Code</label>
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
                  className={`file-picker-container ${newFile ? 'has-file' : ''}`}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                >
                  <FileUp className="w-8 h-8" style={{ margin: '0 auto 8px', display: 'block', color: 'var(--color-primary)' }} />
                  {newFile ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', wordBreak: 'break-all', fontWeight: 600 }}>
                      ✓ {newFile.name}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Click to choose a PDF file (max 50 MB)
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

              {/* Upload Progress Bar */}
              {uploading && (
                <div className="upload-progress">
                  <div className="upload-progress-bar">
                    <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="upload-progress-label">{uploadProgress}%</span>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => !uploading && setIsModalOpen(false)}
                  disabled={uploading}
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? `Uploading... ${uploadProgress}%` : 'Add Lecture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
