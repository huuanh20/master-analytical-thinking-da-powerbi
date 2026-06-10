import { create } from 'zustand';
import type { Lecture, CourseStatus } from '../types';
import { api } from '../services/api';
import { toast } from '../services/toast';

interface AppState {
  lectures: Lecture[];
  activeLecture: Lecture | null;
  searchTerm: string;
  filter: 'all' | 'unread' | 'reading' | 'completed';
  isSidebarOpen: boolean;
  isLoading: boolean;
  error: string | null;

  setSearchTerm: (term: string) => void;
  setFilter: (filter: 'all' | 'unread' | 'reading' | 'completed') => void;
  setActiveLecture: (lecture: Lecture | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;

  fetchLectures: () => Promise<void>;
  updateLectureStatus: (id: string, status: CourseStatus) => Promise<void>;
  saveLectureNote: (id: string, content: string) => Promise<void>;
  uploadLecture: (title: string, lectureNumber: string, file: File) => Promise<void>;
  deleteLecture: (id: string) => Promise<void>;
}

const mapStatusFromBE = (statusNum: number): CourseStatus => {
  switch (statusNum) {
    case 1: return 'reading';
    case 2: return 'completed';
    default: return 'unread';
  }
};

const mapStatusToBE = (status: CourseStatus): number => {
  switch (status) {
    case 'reading': return 1;
    case 'completed': return 2;
    default: return 0;
  }
};

const STATUS_LABELS: Record<CourseStatus, string> = {
  unread: 'Unread',
  reading: 'In Progress',
  completed: 'Completed',
};

export const useAppStore = create<AppState>((set, get) => ({
  lectures: [],
  activeLecture: null,
  searchTerm: '',
  filter: 'all',
  isSidebarOpen: true,
  isLoading: false,
  error: null,

  setSearchTerm: (term) => set({ searchTerm: term }),
  setFilter: (filter) => set({ filter }),
  setActiveLecture: (lecture) => set({ activeLecture: lecture }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  fetchLectures: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/lectures');
      const mappedLectures: Lecture[] = (response.data as {
        id: string;
        title: string;
        fileName: string;
        filePath: string;
        lectureNumber: string;
        sizeBytes: number;
        status: number;
        noteContent: string;
      }[]).map((l) => ({
        ...l,
        status: mapStatusFromBE(l.status),
      }));
      set({ lectures: mappedLectures, isLoading: false });

      // Auto-select first lecture if none selected
      const currentActive = get().activeLecture;
      if (!currentActive && mappedLectures.length > 0) {
        set({ activeLecture: mappedLectures[0] });
      } else if (currentActive) {
        // Sync active lecture with updated data
        const updatedActive = mappedLectures.find((l) => l.id === currentActive.id);
        if (updatedActive) set({ activeLecture: updatedActive });
      }
    } catch (err) {
      console.error(err);
      set({
        error: 'Failed to fetch lectures. Please check if backend is running on port 5030.',
        isLoading: false,
      });
    }
  },

  updateLectureStatus: async (id, status) => {
    // Optimistic update — update UI immediately before API call
    const prevState = get();
    set((state) => {
      const updatedLectures = state.lectures.map((l) =>
        l.id === id ? { ...l, status } : l
      );
      const updatedActive = state.activeLecture?.id === id
        ? { ...state.activeLecture, status }
        : state.activeLecture;
      return { lectures: updatedLectures, activeLecture: updatedActive };
    });

    try {
      const statusValue = mapStatusToBE(status);
      await api.put(`/lectures/${id}/status`, { status: statusValue });
      toast.success(`Status updated`, `Marked as "${STATUS_LABELS[status]}"`, 2000);
    } catch (err) {
      // Rollback on error
      console.error('Failed to update lecture status', err);
      set({
        lectures: prevState.lectures,
        activeLecture: prevState.activeLecture,
      });
      toast.error('Update failed', 'Could not update lecture status. Please try again.');
    }
  },

  saveLectureNote: async (id, content) => {
    try {
      await api.post(`/lectures/${id}/notes`, { content });
      set((state) => {
        const updatedLectures = state.lectures.map((l) =>
          l.id === id ? { ...l, noteContent: content } : l
        );
        const updatedActive = state.activeLecture?.id === id
          ? { ...state.activeLecture, noteContent: content }
          : state.activeLecture;
        return { lectures: updatedLectures, activeLecture: updatedActive };
      });
    } catch (err) {
      console.error('Failed to save lecture notes', err);
      throw err; // Let NotesPanel handle the error with toast
    }
  },

  uploadLecture: async (title, lectureNumber, file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('lectureNumber', lectureNumber);
      formData.append('file', file);

      await api.post('/lectures', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Re-fetch to get the new lecture
      await get().fetchLectures();
    } catch (err) {
      console.error('Failed to upload PDF', err);
      set({ error: 'Failed to upload PDF. Please make sure the Lecture Code is unique.', isLoading: false });
      throw err;
    }
  },

  deleteLecture: async (id) => {
    // Optimistic update
    const prevState = get();
    set((state) => {
      const updatedLectures = state.lectures.filter((l) => l.id !== id);
      let updatedActive = state.activeLecture;
      if (state.activeLecture?.id === id) {
        updatedActive = updatedLectures.length > 0 ? updatedLectures[0] : null;
      }
      return { lectures: updatedLectures, activeLecture: updatedActive };
    });

    try {
      await api.delete(`/lectures/${id}`);
    } catch (err) {
      // Rollback on error
      console.error('Failed to delete lecture', err);
      set({ lectures: prevState.lectures, activeLecture: prevState.activeLecture });
      toast.error('Delete failed', 'Could not delete the lecture. Please try again.');
      throw err;
    }
  },
}));
