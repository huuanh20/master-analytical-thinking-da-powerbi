export type CourseStatus = 'unread' | 'reading' | 'completed';

export interface Lecture {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  lectureNumber: string;
  sizeBytes: number;
  status: CourseStatus;
  noteContent: string;
}

export interface UpdateStatusRequest {
  status: CourseStatus;
}

export interface SaveNoteRequest {
  content: string;
}
