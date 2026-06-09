import { create } from 'zustand';
import type { Lecture, CourseStatus } from '../types';
import { api } from '../services/api';

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
      // BE returns status as number (enum): 0 = Unread, 1 = Reading, 2 = Completed
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

      // Auto select first lecture if none selected
      const currentActive = get().activeLecture;
      if (!currentActive && mappedLectures.length > 0) {
        set({ activeLecture: mappedLectures[0] });
      } else if (currentActive) {
        // Sync active lecture state with updated list
        const updatedActive = mappedLectures.find(l => l.id === currentActive.id);
        if (updatedActive) set({ activeLecture: updatedActive });
      }
    } catch (err) {
      console.error(err);
      set({ error: 'Failed to fetch lectures. Please check if backend is running.', isLoading: false });
    }
  },

  updateLectureStatus: async (id, status) => {
    try {
      const statusValue = mapStatusToBE(status);
      await api.put(`/lectures/${id}/status`, { status: statusValue });
      
      set((state) => {
        const updatedLectures = state.lectures.map((l) =>
          l.id === id ? { ...l, status } : l
        );
        const updatedActive = state.activeLecture && state.activeLecture.id === id 
          ? { ...state.activeLecture, status } 
          : state.activeLecture;
        return { lectures: updatedLectures, activeLecture: updatedActive };
      });
    } catch (err) {
      console.error('Failed to update lecture status', err);
    }
  },

  saveLectureNote: async (id, content) => {
    try {
      await api.post(`/lectures/${id}/notes`, { content });
      
      set((state) => {
        const updatedLectures = state.lectures.map((l) =>
          l.id === id ? { ...l, noteContent: content } : l
        );
        const updatedActive = state.activeLecture && state.activeLecture.id === id
          ? { ...state.activeLecture, noteContent: content }
          : state.activeLecture;
        return { lectures: updatedLectures, activeLecture: updatedActive };
      });
    } catch (err) {
      console.error('Failed to save lecture notes', err);
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
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Fetch lectures list again to show the newly uploaded lecture
      const { fetchLectures } = get();
      await fetchLectures();
    } catch (err) {
      console.error('Failed to upload PDF', err);
      set({ error: 'Failed to upload PDF. Please make sure the Lecture Code is unique.', isLoading: false });
      throw err;
    }
  },

  deleteLecture: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/lectures/${id}`);
      
      set((state) => {
        const updatedLectures = state.lectures.filter((l) => l.id !== id);
        let updatedActive = state.activeLecture;
        if (state.activeLecture && state.activeLecture.id === id) {
          // If deleted active lecture, select the first remaining one or null
          updatedActive = updatedLectures.length > 0 ? updatedLectures[0] : null;
        }
        return { lectures: updatedLectures, activeLecture: updatedActive, isLoading: false };
      });
    } catch (err) {
      console.error('Failed to delete lecture', err);
      set({ error: 'Failed to delete lecture. Please try again.', isLoading: false });
    }
  },
}));
