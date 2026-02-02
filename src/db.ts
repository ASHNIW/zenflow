import Dexie, { Table } from 'dexie';
import { Task, Project, TimeLog, Tag } from './types';

class ZenFlowDatabase extends Dexie {
  tasks!: Table<Task>;
  projects!: Table<Project>;
  timeLogs!: Table<TimeLog>;
  tags!: Table<Tag>;

  constructor() {
    super('ZenFlowDB');
    (this as any).version(1).stores({
      tasks: 'id, parentId, projectId, status, createdAt',
      projects: 'id, name',
      timeLogs: 'id, taskId, startTime, type',
      tags: 'id, name'
    });
  }
}

export const db = new ZenFlowDatabase();

// Helper to seed initial data if empty
export const seedDatabase = async () => {
  const count = await db.projects.count();
  if (count === 0) {
    await db.projects.bulkAdd([
      { id: 'p1', name: 'Development', color: '#3b82f6' },
      { id: 'p2', name: 'Design', color: '#ec4899' },
      { id: 'p3', name: 'Marketing', color: '#f59e0b' },
    ]);
    
    await db.tags.bulkAdd([
      { id: 't1', name: 'Urgent', color: '#ef4444' },
      { id: 't2', name: 'Bug', color: '#ef4444' },
      { id: 't3', name: 'Feature', color: '#3b82f6' },
    ]);
  }
};