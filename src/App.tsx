import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  BarChart2, 
  Settings, 
  Plus, 
  Search,
  Menu,
  X,
  Zap,
  Download,
  Upload,
  Database,
  AlertTriangle,
  Filter,
  ArrowLeft,
  Trash2,
  ListFilter,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  CalendarArrowDown,
  CalendarArrowUp,
  Bell,
  Clock,
  History,
  Check
} from 'lucide-react';
import { db, seedDatabase } from './db';
import { Task, Project, Tag, TimeLog, TaskStatus, Priority } from './types';
import TaskList, { SortConfig } from './components/TaskList';
import Analytics from './components/Analytics';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

// Fix for strict TypeScript environments
const MotionDiv = motion.div as any;
const MotionP = motion.p as any;
const MotionInput = motion.input as any;
const MotionButton = motion.button as any;

// Simple ID generator
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Modal Component for Creating OR Editing Tasks
const TaskFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, startDate: number, endDate?: number, priority?: Priority) => void;
  initialTask?: Task | null;
}> = ({ isOpen, onClose, onSave, initialTask }) => {
  const [title, setTitle] = useState("");
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);

  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setTitle(initialTask.title);
        setStartDateStr(initialTask.startDate ? new Date(initialTask.startDate).toISOString().split('T')[0] : "");
        setEndDateStr(initialTask.endDate ? new Date(initialTask.endDate).toISOString().split('T')[0] : "");
        setPriority(initialTask.priority || Priority.MEDIUM);
      } else {
        setTitle("");
        setStartDateStr(new Date().toISOString().split('T')[0]); // Default to today
        setEndDateStr("");
        setPriority(Priority.MEDIUM);
      }
    }
  }, [isOpen, initialTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const start = startDateStr ? new Date(startDateStr).getTime() : Date.now();
    const end = endDateStr ? new Date(endDateStr).getTime() : undefined;

    onSave(title, start, end, priority);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <MotionDiv 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-xl font-bold text-white mb-4">
          {initialTask ? 'Edit Task' : 'New Task'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Task Title</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Start Date</label>
              <input 
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Due Date <span className="text-zinc-600 normal-case">(Optional)</span></label>
              <input 
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
             <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Priority</label>
             <div className="flex gap-2 bg-black/30 p-1 rounded-lg border border-zinc-800">
                {[Priority.LOW, Priority.MEDIUM, Priority.HIGH].map((p) => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={clsx(
                            "flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all",
                            priority === p 
                                ? (p === Priority.HIGH ? "bg-rose-500 text-white" : p === Priority.MEDIUM ? "bg-amber-500 text-black" : "bg-slate-500 text-white")
                                : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                        )}
                    >
                        {p}
                    </button>
                ))}
             </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!title.trim()}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </MotionDiv>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
}> = ({ isOpen, onClose, onConfirm, taskTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <MotionDiv 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
      >
        <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mb-4">
           <Trash2 size={24} className="text-rose-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Delete Task?</h3>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          Are you sure you want to delete <span className="text-white font-medium">"{taskTitle}"</span>? This action cannot be undone.
        </p>
        
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium shadow-lg shadow-rose-600/20 transition-colors"
          >
            Delete
          </button>
        </div>
      </MotionDiv>
    </div>
  );
};

// Settings Page Component (Kept same as before but ensured types)
const SettingsView: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const [tasks, projects, tags, logs] = await Promise.all([
        db.tasks.toArray(),
        db.projects.toArray(),
        db.tags.toArray(),
        db.timeLogs.toArray()
      ]);

      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        tasks,
        projects,
        tags,
        logs
      };

      const jsonString = JSON.stringify(data, null, 2);
      const fileName = `zenflow-backup-${new Date().toISOString().split('T')[0]}.json`;

      try {
        // Use text/plain for better compatibility with Android share targets (Email, Keep, Drive etc.)
        // application/json is often filtered out by mobile apps
        const file = new File([jsonString], fileName, { type: 'text/plain' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'ZenFlow Backup',
                text: `Backup created on ${new Date().toLocaleDateString()}`,
            });
            return; 
        }
      } catch (shareError) {
         if ((shareError as Error).name === 'AbortError') return;
         console.warn("Web Share API failed, falling back to download", shareError);
      }

      // Fallback: Force download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      }, 2000);
      
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. " + (error instanceof Error ? error.message : ""));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Importing data will merge with your current tasks. Continue?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);

        await (db as any).transaction('rw', db.tasks, db.projects, db.tags, db.timeLogs, async () => {
          if (data.tasks) await db.tasks.bulkPut(data.tasks);
          if (data.projects) await db.projects.bulkPut(data.projects);
          if (data.tags) await db.tags.bulkPut(data.tags);
          if (data.logs) await db.timeLogs.bulkPut(data.logs);
        });

        alert("Import successful!");
        onRefresh();
      } catch (error) {
        console.error("Import failed:", error);
        alert("Failed to import data. Please ensure the file is valid.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold mb-2">Settings</h2>
      <p className="text-zinc-500 mb-8">Manage your application data and preferences.</p>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Database size={100} />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2 relative z-10">
          <Database size={24} className="text-indigo-500" />
          Data Management
        </h3>
        <p className="text-zinc-400 text-sm mb-6 relative z-10 max-w-md">
          Export your tasks, projects, and time logs to a JSON file for backup or transfer. Import a backup file to restore your data.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all font-medium border border-zinc-700/50 hover:border-zinc-600"
          >
            <Download size={18} />
            Export Backup
          </button>
          
          <div className="relative">
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <label 
              htmlFor="import-file"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-medium cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              <Upload size={18} />
              Import Backup
            </label>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 opacity-75">
        <h3 className="text-lg font-bold text-zinc-400 mb-2 flex items-center gap-2">
          <AlertTriangle size={20} />
          Danger Zone
        </h3>
        <p className="text-zinc-500 text-sm mb-4">
          Irreversible actions for your data.
        </p>
        <button 
          onClick={async () => {
             if (window.confirm("Are you sure you want to delete ALL data? This cannot be undone.")) {
               await Promise.all([db.tasks.clear(), db.projects.clear(), db.tags.clear(), db.timeLogs.clear()]);
               await seedDatabase();
               onRefresh();
               alert("Database reset.");
             }
          }}
          className="text-red-400 hover:text-red-300 text-sm font-medium hover:underline"
        >
          Reset Database to Defaults
        </button>
      </div>
    </div>
  );
};

// Types for Filters
type FilterType = 'ALL' | 'COMPLETED' | 'PINNED' | 'PRIORITY';

const AppContent: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sort State
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'PRIORITY', direction: 'DESC' });
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  
  // Notifications
  const [showNotifications, setShowNotifications] = useState(true);
  
  // Delete State
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Filter State
  const [filter, setFilter] = useState<{type: FilterType, value?: any}>({ type: 'ALL' });

  // Load Data
  useEffect(() => {
    seedDatabase().then(refreshData);
  }, []);

  const refreshData = async () => {
    const [t, p, tg, l] = await Promise.all([
      db.tasks.toArray(),
      db.projects.toArray(),
      db.tags.toArray(),
      db.timeLogs.toArray()
    ]);
    setTasks(t);
    setProjects(p);
    setTags(tg);
    setLogs(l);
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSaveTask = async (title: string, startDate: number, endDate?: number, priority?: Priority) => {
    if (editingTask) {
      // Update existing
      await db.tasks.update(editingTask.id, {
        title,
        startDate,
        endDate,
        priority: priority || Priority.MEDIUM,
        updatedAt: Date.now()
      });
    } else {
      // Create new
      const newTask: Task = {
        id: generateId(),
        title,
        status: TaskStatus.TODO,
        priority: priority || Priority.MEDIUM,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        startDate: startDate,
        endDate: endDate,
        isPinned: false
      };
      await db.tasks.add(newTask);
    }
    refreshData();
    setModalOpen(false);
    setEditingTask(null);
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
    await db.tasks.update(task.id, { 
      status: newStatus,
      updatedAt: Date.now()
    });
    refreshData();
  };

  const handleUpdateTaskTitle = async (task: Task, newTitle: string) => {
    if (!newTitle.trim() || newTitle === task.title) return;
    await db.tasks.update(task.id, {
      title: newTitle,
      updatedAt: Date.now()
    });
    refreshData();
  };

  const handlePinTask = async (task: Task) => {
    const newPinnedState = !task.isPinned;
    await db.tasks.update(task.id, {
      isPinned: newPinnedState,
      updatedAt: Date.now()
    });
    refreshData();
  };

  // Step 1: Request Deletion (Open Modal)
  const handleRequestDelete = (task: Task) => {
    setTaskToDelete(task);
  };

  // Step 2: Confirm Deletion (Execute DB Action)
  const confirmDeleteTask = async () => {
    if (taskToDelete) {
      await db.tasks.delete(taskToDelete.id);
      setTaskToDelete(null); // Close modal
      refreshData();
    }
  };

  const handleNavigateFilter = (type: FilterType, value?: any) => {
    setFilter({ type, value });
    navigate('/');
    setSidebarOpen(false);
  };

  // Filter tasks logic
  const filteredTasks = tasks.filter(t => {
    // 1. Text Search
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // 2. Specific View Filters
    switch (filter.type) {
        case 'COMPLETED':
            return t.status === TaskStatus.COMPLETED;
        case 'PINNED':
            return t.isPinned;
        case 'PRIORITY':
            return t.priority === filter.value && t.status !== TaskStatus.COMPLETED;
        case 'ALL':
        default:
            return true; // Show everything (Sort logic handles order)
    }
  });

  const todoCount = tasks.filter(t => t.status !== TaskStatus.COMPLETED).length;

  // Notification Logic
  const oneDay = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const tasksDueSoon = tasks.filter(t => 
    t.status !== TaskStatus.COMPLETED && 
    t.endDate && 
    t.endDate > now && 
    t.endDate < (now + oneDay)
  );
  const tasksOverdue = tasks.filter(t => 
    t.status !== TaskStatus.COMPLETED && 
    t.endDate && 
    t.endDate < now
  );
  const totalWarnings = tasksDueSoon.length + tasksOverdue.length;

  const getHeaderTitle = () => {
      switch(filter.type) {
          case 'COMPLETED': return 'Completed Tasks';
          case 'PINNED': return 'Pinned Tasks';
          case 'PRIORITY': 
            const p = filter.value as string;
            return `${p.charAt(0) + p.slice(1).toLowerCase()} Priority`;
          default: return 'My Tasks';
      }
  };

  // Sort label helper
  const getSortLabel = () => {
     if (sortConfig.key === 'PRIORITY') return 'Priority (High)';
     if (sortConfig.key === 'DUE_DATE') return 'Due Soon';
     if (sortConfig.key === 'CREATED') return 'Newest';
     return '';
  };
  
  const isSortActive = (key: string, direction: string) => {
      return sortConfig.key === key && sortConfig.direction === direction;
  };

  // Nav Item Component
  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <Link 
      to={to} 
      onClick={() => setSidebarOpen(false)}
      className={clsx(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
        location.pathname === to 
          ? "bg-zinc-800 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
      )}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );

  return (
    <div className="flex h-[100dvh] bg-black text-white overflow-hidden font-sans selection:bg-indigo-500/30 w-full">
      
      <TaskFormModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onSave={handleSaveTask}
        initialTask={editingTask}
      />

      <DeleteConfirmationModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDeleteTask}
        taskTitle={taskToDelete?.title || ''}
      />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <MotionDiv 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Sort Menu Backdrop - FIXED: z-20 to be below header(z-30) so header clicks work */}
      {isSortMenuOpen && (
        <div 
          className="fixed inset-0 z-20 bg-transparent"
          onClick={() => setIsSortMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-900 transform transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] lg:relative lg:translate-x-0 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-8 pb-8 pt-[calc(2rem+env(safe-area-inset-top))] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="text-2xl font-bold tracking-tight">ZenFlow</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem to="/" icon={CheckSquare} label="My Tasks" />
          <NavItem to="/analytics" icon={BarChart2} label="Analytics" />
          <NavItem to="/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-6">
           <div className="p-5 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border border-zinc-800/50 shadow-inner">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Productivity</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">{todoCount}</span>
              <span className="text-sm text-zinc-500">pending tasks</span>
            </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative bg-black">
        {/* Header - Sticky with safe area awareness */}
        <header className="px-6 pb-4 pt-[calc(1.5rem+env(safe-area-inset-top))] md:px-8 md:pb-6 md:pt-[calc(2rem+env(safe-area-inset-top))] flex items-center justify-between sticky top-0 z-30 bg-black/80 backdrop-blur-xl transition-all">
           <div className="flex flex-col">
              <MotionDiv 
                 key={filter.type + filter.value}
                 initial={{ opacity: 0, y: -5 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="flex items-center gap-2"
              >
                {filter.type !== 'ALL' && (
                    <button 
                        onClick={() => setFilter({ type: 'ALL' })}
                        className="p-1 -ml-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {getHeaderTitle()}
                </h1>
              </MotionDiv>
              
              <div className="flex items-center gap-3 mt-1">
                  <MotionP 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-zinc-500 font-medium"
                  >
                    {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                  </MotionP>
                  <span className="text-zinc-700">•</span>
                  <MotionP
                    key={sortConfig.key + sortConfig.direction}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-indigo-400 text-sm font-semibold flex items-center gap-1"
                  >
                    {getSortLabel()}
                  </MotionP>
              </div>
           </div>
           
           <div className="flex items-center gap-2 md:gap-4">
              <AnimatePresence>
                {isSearchOpen && (
                  <MotionInput
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 150, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-zinc-700 text-white placeholder-zinc-600 hidden md:block"
                    autoFocus
                  />
                )}
              </AnimatePresence>

              {/* Sort Menu */}
              <div className="relative z-50">
                 <button 
                  onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                  className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full text-white transition-all active:scale-95"
                  title="Sort Tasks"
                 >
                   <ListFilter size={20} />
                 </button>
                 
                 <AnimatePresence>
                    {isSortMenuOpen && (
                        <MotionDiv 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 w-60 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden py-1 max-h-[60vh] overflow-y-auto custom-scrollbar"
                        >
                           <p className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">Sort By</p>
                           
                           <div className="py-1">
                               <button 
                                type="button"
                                onClick={() => { setSortConfig({ key: 'PRIORITY', direction: 'DESC' }); setIsSortMenuOpen(false); }}
                                className={clsx("w-full px-4 py-3 flex items-center justify-between text-sm transition-colors", isSortActive('PRIORITY', 'DESC') ? "text-indigo-400 font-bold bg-zinc-800" : "text-zinc-300 hover:bg-zinc-800")}
                               >
                                 <div className="flex items-center gap-3">
                                   <ArrowDownNarrowWide size={16} />
                                   Priority (High - Low)
                                 </div>
                                 {isSortActive('PRIORITY', 'DESC') && <Check size={14} />}
                               </button>

                               <div className="h-px bg-zinc-800 mx-4 my-1"></div>

                               <button 
                                type="button"
                                onClick={() => { setSortConfig({ key: 'DUE_DATE', direction: 'ASC' }); setIsSortMenuOpen(false); }}
                                className={clsx("w-full px-4 py-3 flex items-center justify-between text-sm transition-colors", isSortActive('DUE_DATE', 'ASC') ? "text-indigo-400 font-bold bg-zinc-800" : "text-zinc-300 hover:bg-zinc-800")}
                               >
                                 <div className="flex items-center gap-3">
                                   <CalendarArrowUp size={16} />
                                   Due Date (Soonest)
                                 </div>
                                 {isSortActive('DUE_DATE', 'ASC') && <Check size={14} />}
                               </button>

                               <div className="h-px bg-zinc-800 mx-4 my-1"></div>

                               <button 
                                type="button"
                                onClick={() => { setSortConfig({ key: 'CREATED', direction: 'DESC' }); setIsSortMenuOpen(false); }}
                                className={clsx("w-full px-4 py-3 flex items-center justify-between text-sm transition-colors", isSortActive('CREATED', 'DESC') ? "text-indigo-400 font-bold bg-zinc-800" : "text-zinc-300 hover:bg-zinc-800")}
                               >
                                 <div className="flex items-center gap-3">
                                   <History size={16} />
                                   Date Added (Newest)
                                 </div>
                                 {isSortActive('CREATED', 'DESC') && <Check size={14} />}
                               </button>
                           </div>
                        </MotionDiv>
                    )}
                 </AnimatePresence>
              </div>

              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full text-white transition-all active:scale-95"
              >
                <Search size={20} />
              </button>
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="lg:hidden p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full text-white transition-all active:scale-95"
              >
                <Menu size={20} />
              </button>
           </div>
        </header>

        {/* Notifications Banner - Sticky */}
        <AnimatePresence>
            {showNotifications && totalWarnings > 0 && (
                <MotionDiv
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 md:px-8 mb-4 sticky top-24 z-20"
                >
                    <div className="bg-gradient-to-r from-orange-500/90 to-rose-500/90 shadow-lg shadow-orange-500/20 border border-orange-400/30 rounded-xl p-4 flex items-center justify-between backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full text-white">
                                <Clock size={18} fill="currentColor" className="text-white/80" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">Action Required</h4>
                                <p className="text-xs text-white/90 font-medium">
                                    {tasksOverdue.length > 0 && <span>{tasksOverdue.length} overdue</span>}
                                    {tasksOverdue.length > 0 && tasksDueSoon.length > 0 && " • "}
                                    {tasksDueSoon.length > 0 && <span>{tasksDueSoon.length} due soon</span>}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowNotifications(false)}
                            className="p-2 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </MotionDiv>
            )}
        </AnimatePresence>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 pb-20 custom-scrollbar">
          <Routes>
            <Route path="/" element={
              <div className="max-w-2xl mx-auto py-4">
                <TaskList 
                  tasks={filteredTasks} 
                  projects={projects} 
                  tags={tags}
                  activeTaskId={activeTask?.id || null}
                  sortConfig={sortConfig}
                  onTaskSelect={setActiveTask}
                  onToggleStatus={handleToggleTask}
                  onUpdateTask={handleUpdateTaskTitle}
                  onPinTask={handlePinTask}
                  onEditTask={handleOpenEdit}
                  onDeleteTask={handleRequestDelete}
                />
              </div>
            } />
            <Route path="/analytics" element={<Analytics tasks={tasks} onNavigateFilter={handleNavigateFilter} />} />
            <Route path="/settings" element={<SettingsView onRefresh={refreshData} />} />
          </Routes>
        </div>
        
        {/* Floating Action Button */}
        <MotionButton
          whileHover={{ scale: 1.1, boxShadow: "0 0 25px rgba(255, 255, 255, 0.4)" }}
          whileTap={{ scale: 0.9 }}
          onClick={handleOpenCreate}
          className="fixed bottom-8 right-6 md:right-10 z-40 bg-white text-black p-4 rounded-full shadow-2xl flex items-center justify-center"
        >
          <Plus size={28} strokeWidth={2.5} />
        </MotionButton>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;