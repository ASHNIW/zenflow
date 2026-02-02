export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'link' | 'file' | 'command';
  content: string; // URL or base64 or text
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  parentId?: string; // For hierarchy
  projectId?: string;
  status: TaskStatus;
  priority: Priority;
  tags: string[]; // Tag IDs
  dueDate?: number;
  startDate?: number;
  endDate?: number;
  estimatedMinutes?: number;
  createdAt: number;
  updatedAt?: number;
  isPinned?: boolean;
  subtasks?: Task[]; // Virtual property for UI tree
  attachments?: Attachment[];
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface TimeLog {
  id: string;
  taskId: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number; // For completed or ongoing chunks
  type: 'POMODORO' | 'MANUAL' | 'FLOW';
}

export interface PomodoroSettings {
  workDuration: number; // minutes
  breakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsBeforeLongBreak: number;
}