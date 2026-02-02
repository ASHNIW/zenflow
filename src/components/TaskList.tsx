import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, Priority } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Sparkles, Calendar, ArrowRight, Pencil, Pin, AlertCircle, ArrowUp, ArrowDown, Minus, Trash2, Clock } from 'lucide-react';

export type SortKey = 'PRIORITY' | 'DUE_DATE' | 'CREATED';
export type SortDirection = 'ASC' | 'DESC';

export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface TaskListProps {
  tasks: Task[];
  projects: any[];
  tags: any[];
  activeTaskId: string | null;
  sortConfig?: SortConfig;
  onTaskSelect: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
  onUpdateTask: (task: Task, newTitle: string) => void;
  onPinTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  level?: number;
}

// Fix for strict TypeScript environments where motion components might conflict with IntrinsicAttributes
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

// Pastel colors for the cards, rotating based on index
const PASTEL_COLORS = [
  'bg-[#EFE9AE]', // Yellowish
  'bg-[#C4D9E8]', // Light Blue
  'bg-[#C6E4D6]', // Light Green
  'bg-[#EAD1DC]', // Light Pink
];

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const config = {
    [Priority.HIGH]: {
      icon: ArrowUp,
      label: 'High',
      styles: 'bg-rose-500 text-white shadow-rose-500/30',
      iconColor: 'text-white'
    },
    [Priority.MEDIUM]: {
      icon: Minus,
      label: 'Med',
      styles: 'bg-amber-400 text-amber-900 shadow-amber-400/30',
      iconColor: 'text-amber-900'
    },
    [Priority.LOW]: {
      icon: ArrowDown,
      label: 'Low',
      styles: 'bg-slate-200 text-slate-600 shadow-slate-200/30',
      iconColor: 'text-slate-600'
    }
  }[priority] || { // Fallback for undefined priority
      icon: Minus,
      label: 'Norm',
      styles: 'bg-zinc-500 text-white',
      iconColor: 'text-white'
  };

  const Icon = config.icon;

  return (
    <MotionDiv 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={clsx(
        "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm backdrop-blur-md",
        config.styles
      )}
    >
      <Icon size={10} strokeWidth={4} />
      <span>{config.label}</span>
    </MotionDiv>
  );
};

const TaskItem: React.FC<{
  task: Task;
  index: number;
  active: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onUpdate: (newTitle: string) => void;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ task, index, active, onToggle, onSelect, onUpdate, onPin, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const bgColor = PASTEL_COLORS[index % PASTEL_COLORS.length];
  
  // Format dates
  const startDateVal = task.startDate || task.createdAt;
  const startDateStr = new Date(startDateVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endDateStr = task.endDate ? new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
  const isOverdue = task.endDate && task.endDate < Date.now() && task.status !== TaskStatus.COMPLETED;
  
  useEffect(() => {
    setEditTitle(task.title);
  }, [task.title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      onUpdate(editTitle);
    } else {
      setEditTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  const isPinnedAndActive = task.isPinned && task.status !== TaskStatus.COMPLETED;

  return (
    <MotionDiv
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={isPinnedAndActive ? {
        opacity: 1, 
        y: 0, 
        scale: 1.02,
        borderColor: ["rgba(251, 191, 36, 0.6)", "rgba(251, 191, 36, 1)", "rgba(251, 191, 36, 0.6)"],
        boxShadow: [
          "0 0 15px 2px rgba(251, 191, 36, 0.4)", 
          "0 0 40px 10px rgba(251, 191, 36, 0.8)", 
          "0 0 15px 2px rgba(251, 191, 36, 0.4)"
        ]
      } : {
        opacity: 1, 
        y: 0, 
        scale: 1,
        borderColor: "transparent",
        boxShadow: isHovered && task.status !== TaskStatus.COMPLETED 
          ? `0 10px 30px -10px ${bgColor.replace('bg-', '')}`
          : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      }}
      transition={isPinnedAndActive ? {
        borderColor: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
        boxShadow: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
        layout: { duration: 0.2 },
        default: { duration: 0.2 }
      } : {
        layout: { duration: 0.2 },
        default: { duration: 0.2 }
      }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onSelect}
      className={clsx(
        "relative w-full mb-4 p-5 rounded-3xl cursor-pointer transition-colors border-2",
        bgColor,
        task.status === TaskStatus.COMPLETED ? "opacity-50 grayscale-[0.5] border-transparent" : "shadow-lg",
        active && "ring-4 ring-white/30"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <MotionButton
          whileTap={{ scale: 0.8 }}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onToggle(); }}
          className="mt-1 flex-shrink-0 w-7 h-7 rounded-full border-2 border-black/80 flex items-center justify-center relative bg-transparent"
        >
          {task.status === TaskStatus.COMPLETED && (
            <MotionDiv 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-4 h-4 rounded-full bg-black"
            />
          )}
        </MotionButton>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
             <div className="flex-1">
                {isEditing ? (
                    <input
                    ref={inputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="text-lg font-bold text-black bg-transparent border-b-2 border-black/20 focus:outline-none focus:border-black w-full p-0 m-0 leading-snug"
                    />
                ) : (
                    <h3 
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                    }}
                    className={clsx(
                        "text-lg font-bold text-black leading-snug break-words select-none pr-6",
                        task.status === TaskStatus.COMPLETED && "line-through decoration-2"
                    )}
                    >
                    {task.title}
                    </h3>
                )}
             </div>
             {/* Priority Badge */}
             {!isEditing && task.status !== TaskStatus.COMPLETED && (
                <PriorityBadge priority={task.priority} />
             )}
          </div>
          
          <div className="mt-3 flex items-center justify-between text-black/60 text-xs font-semibold">
             <div className="flex items-center gap-3 flex-wrap">
               <span className={clsx(
                   "flex items-center gap-1 bg-black/5 px-2 py-1 rounded-full cursor-pointer hover:bg-black/10 transition-colors",
                   isOverdue && "bg-rose-500/20 text-rose-700"
               )} onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  {isOverdue ? <AlertCircle size={10} /> : <Calendar size={10} />}
                  <span>{startDateStr}</span>
                  {endDateStr && (
                    <>
                      <ArrowRight size={8} />
                      <span className={isOverdue ? "font-bold" : ""}>{endDateStr}</span>
                    </>
                  )}
               </span>
             </div>
             
             {/* Action Buttons */}
             <div className="flex items-center gap-1">
                <MotionButton 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onPin();
                  }}
                  className={clsx(
                    "p-2 rounded-full text-black transition-colors backdrop-blur-sm",
                    task.isPinned ? "bg-amber-400/50 hover:bg-amber-400/70" : "bg-black/5 hover:bg-black/10"
                  )}
                  title={task.isPinned ? "Unpin Task" : "Pin Task"}
                >
                  <Pin size={14} fill={task.isPinned ? "currentColor" : "none"} />
                </MotionButton>

                <MotionButton 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-2 bg-black/5 rounded-full hover:bg-black/10 text-black transition-colors backdrop-blur-sm"
                  title="Edit Details"
                >
                  <Pencil size={14} />
                </MotionButton>

                <MotionButton 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-2 bg-rose-500/10 rounded-full hover:bg-rose-500/20 text-rose-600 transition-colors backdrop-blur-sm"
                  title="Delete Task"
                >
                  <Trash2 size={14} />
                </MotionButton>
             </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  );
};

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, activeTaskId, sortConfig = { key: 'PRIORITY', direction: 'DESC' }, onTaskSelect, onToggleStatus, onUpdateTask, onPinTask, onEditTask, onDeleteTask
}) => {
  // Robust Sort Logic
  const sortedTasks = [...tasks].sort((a, b) => {
    const aCompleted = a.status === TaskStatus.COMPLETED;
    const bCompleted = b.status === TaskStatus.COMPLETED;

    // 1. Completed at bottom
    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;

    // 2. Pinned at top (only for active tasks)
    if (!aCompleted) {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    }

    // 3. Main Sort
    let diff = 0;
    
    switch (sortConfig.key) {
      case 'PRIORITY':
        const pVal = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
        diff = (pVal[a.priority] || 1) - (pVal[b.priority] || 1);
        break;
        
      case 'DUE_DATE':
        // Logic: Dates first (sorted), then No Dates.
        // We use check if date exists to push "no date" to bottom for ASC.
        if (a.endDate && !b.endDate) diff = -1; // A has date, B doesn't -> A first
        else if (!a.endDate && b.endDate) diff = 1; // B has date, A doesn't -> B first
        else if (!a.endDate && !b.endDate) diff = 0;
        else diff = (a.endDate || 0) - (b.endDate || 0); // Both have dates
        break;

      case 'CREATED':
        diff = a.createdAt - b.createdAt;
        break;
    }

    if (diff !== 0) {
        // Apply direction. 
        // Note: For Due Date, our custom logic above already handles "No Date" position relative to top.
        // But if direction is ASC (Soonest), diff (timestamp) is correct.
        // If sortConfig.key is DUE_DATE, we generally trust the diff calculation above for ASC.
        if (sortConfig.key === 'DUE_DATE') {
            return diff; // We only support "Soonest" (ASC) effectively, or handled custom
        }
        return sortConfig.direction === 'ASC' ? diff : -diff;
    }

    // 4. Tie-breaker: Created Date (Newest first)
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="w-full pb-20">
      <AnimatePresence mode='popLayout'>
        {sortedTasks.map((task, index) => (
          <TaskItem
            key={task.id}
            index={index}
            task={task}
            active={task.id === activeTaskId}
            onToggle={() => onToggleStatus(task)}
            onSelect={() => onTaskSelect(task)}
            onUpdate={(newTitle) => onUpdateTask(task, newTitle)}
            onPin={() => onPinTask(task)}
            onEdit={() => onEditTask(task)}
            onDelete={() => onDeleteTask(task)}
          />
        ))}
      </AnimatePresence>

      {tasks.length === 0 && (
        <MotionDiv 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-zinc-600"
        >
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <Sparkles size={32} className="text-zinc-500" />
          </div>
          <p className="text-lg font-medium">All caught up!</p>
          <p className="text-sm">Create a new task to get started.</p>
        </MotionDiv>
      )}
    </div>
  );
};

export default TaskList;