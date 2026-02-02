import React, { useState } from 'react';
import { Task, TaskStatus, Priority } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ListTodo, Pin, ChevronRight, ArrowUp, Minus, ArrowDown } from 'lucide-react';
import clsx from 'clsx';

// Fix for strict TypeScript environments
const MotionDiv = motion.div as any;
const MotionH2 = motion.h2 as any;
const MotionP = motion.p as any;
const MotionButton = motion.button as any;

interface AnalyticsProps {
  tasks: Task[];
  onNavigateFilter: (type: 'ALL' | 'COMPLETED' | 'PINNED' | 'PRIORITY', value?: any) => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ tasks, onNavigateFilter }) => {
  const [isCreatedExpanded, setIsCreatedExpanded] = useState(false);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const pinnedTasks = tasks.filter(t => t.isPinned).length;

  // Priority Counts
  const highCount = tasks.filter(t => t.priority === Priority.HIGH && t.status !== TaskStatus.COMPLETED).length;
  const medCount = tasks.filter(t => t.priority === Priority.MEDIUM && t.status !== TaskStatus.COMPLETED).length;
  const lowCount = tasks.filter(t => t.priority === Priority.LOW && t.status !== TaskStatus.COMPLETED).length;

  const cardVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, type: "spring", stiffness: 100 }
    })
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-6 relative overflow-hidden pb-32">
        {/* Background Ambient Animation */}
        <div className="absolute inset-0 pointer-events-none">
            <MotionDiv
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]"
            />
            <MotionDiv
                animate={{
                    scale: [1, 1.5, 1],
                    x: [0, 50, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-900/20 rounded-full blur-[80px]"
            />
        </div>

        <div className="w-full max-w-md z-10 space-y-6">
            <div className="text-center mb-10">
                <MotionH2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-white tracking-tight"
                >
                    Overview
                </MotionH2>
                <MotionP 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-zinc-500"
                >
                    Tap cards to filter tasks
                </MotionP>
            </div>

            {/* Created / Active Tasks Card - Expandable */}
            <MotionDiv
                custom={0}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                layout
                onClick={() => setIsCreatedExpanded(!isCreatedExpanded)}
                className="relative bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-xl cursor-pointer group hover:border-blue-500/30 transition-colors"
            >
                <div className="p-6 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <ListTodo size={24} />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Active Tasks</p>
                            <p className="text-3xl font-black text-white">{totalTasks - completedTasks}</p>
                        </div>
                    </div>
                    <MotionDiv 
                        animate={{ rotate: isCreatedExpanded ? 90 : 0 }}
                        className="text-zinc-500"
                    >
                        <ChevronRight size={24} />
                    </MotionDiv>
                </div>
                
                {/* Decoration */}
                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <ListTodo size={100} />
                </div>

                {/* Expanded Priority List */}
                <AnimatePresence>
                    {isCreatedExpanded && (
                        <MotionDiv
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-zinc-950/50 border-t border-zinc-800/50"
                        >
                            <div className="p-4 space-y-2">
                                <MotionButton
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); onNavigateFilter('PRIORITY', Priority.HIGH); }}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group/item"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-500">
                                            <ArrowUp size={16} strokeWidth={3} />
                                        </div>
                                        <span className="font-bold text-zinc-300 group-hover/item:text-white">High Priority</span>
                                    </div>
                                    <span className="font-mono text-rose-400">{highCount}</span>
                                </MotionButton>

                                <MotionButton
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); onNavigateFilter('PRIORITY', Priority.MEDIUM); }}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group/item"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500">
                                            <Minus size={16} strokeWidth={3} />
                                        </div>
                                        <span className="font-bold text-zinc-300 group-hover/item:text-white">Medium Priority</span>
                                    </div>
                                    <span className="font-mono text-amber-400">{medCount}</span>
                                </MotionButton>

                                <MotionButton
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); onNavigateFilter('PRIORITY', Priority.LOW); }}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group/item"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-slate-500/20 text-slate-400">
                                            <ArrowDown size={16} strokeWidth={3} />
                                        </div>
                                        <span className="font-bold text-zinc-300 group-hover/item:text-white">Low Priority</span>
                                    </div>
                                    <span className="font-mono text-slate-400">{lowCount}</span>
                                </MotionButton>
                            </div>
                        </MotionDiv>
                    )}
                </AnimatePresence>
            </MotionDiv>

            {/* Completed Tasks Card */}
            <MotionDiv
                custom={1}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigateFilter('COMPLETED')}
                className="relative bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-xl cursor-pointer group hover:border-emerald-500/30 transition-colors"
            >
                <div className="p-6 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Completed</p>
                            <p className="text-3xl font-black text-white">{completedTasks}</p>
                        </div>
                    </div>
                    <div className="text-zinc-500 group-hover:text-emerald-500 transition-colors">
                        <ChevronRight size={24} />
                    </div>
                </div>
                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <CheckCircle2 size={100} />
                </div>
            </MotionDiv>

            {/* Pinned Tasks Card */}
            <MotionDiv
                custom={2}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigateFilter('PINNED')}
                className="relative bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-xl cursor-pointer group hover:border-amber-500/30 transition-colors"
            >
                <div className="p-6 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Pin size={24} />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Pinned</p>
                            <p className="text-3xl font-black text-white">{pinnedTasks}</p>
                        </div>
                    </div>
                    <div className="text-zinc-500 group-hover:text-amber-500 transition-colors">
                        <ChevronRight size={24} />
                    </div>
                </div>
                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <Pin size={100} />
                </div>
            </MotionDiv>

        </div>
    </div>
  );
};

export default Analytics;