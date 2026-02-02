import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../constants';
import { Task } from '../types';
import { db } from '../db';
import clsx from 'clsx';

// Simple UUID generator since we can't import external lib without package.json context
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

interface TimerProps {
  activeTask: Task | null;
  onSessionComplete: () => void;
}

const Timer: React.FC<TimerProps> = ({ activeTask, onSessionComplete }) => {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'WORK' | 'BREAK'>('WORK');
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);

  // Background timer logic using timestamps to be robust
  useEffect(() => {
    let interval: any;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleStart = async () => {
    if (!activeTask && mode === 'WORK') return; // Enforce task selection for work
    setIsActive(true);

    if (mode === 'WORK' && activeTask) {
      const logId = generateId();
      setCurrentLogId(logId);
      await db.timeLogs.add({
        id: logId,
        taskId: activeTask.id,
        startTime: Date.now(),
        durationSeconds: 0,
        type: 'POMODORO'
      });
    }
  };

  const handlePause = async () => {
    setIsActive(false);
    if (currentLogId) {
      // Update duration
      const log = await db.timeLogs.get(currentLogId);
      if (log) {
        await db.timeLogs.update(currentLogId, {
          endTime: Date.now(),
          durationSeconds: Math.floor((Date.now() - log.startTime) / 1000)
        });
      }
      setCurrentLogId(null);
    }
  };

  const handleComplete = useCallback(() => {
    setIsActive(false);
    handlePause(); // Finalize log
    
    // Play sound (simple beep logic would go here)
    
    if (mode === 'WORK') {
      setMode('BREAK');
      setTimeLeft(DEFAULT_SETTINGS.breakDuration * 60);
      onSessionComplete();
    } else {
      setMode('WORK');
      setTimeLeft(DEFAULT_SETTINGS.workDuration * 60);
    }
  }, [mode, onSessionComplete]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'WORK' 
    ? ((DEFAULT_SETTINGS.workDuration * 60 - timeLeft) / (DEFAULT_SETTINGS.workDuration * 60)) * 100
    : ((DEFAULT_SETTINGS.breakDuration * 60 - timeLeft) / (DEFAULT_SETTINGS.breakDuration * 60)) * 100;

  return (
    <div className="bg-zinc-900 border-t border-zinc-800 p-4 flex items-center justify-between sticky bottom-0 z-50">
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="#27272a" // zinc-800
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke={mode === 'WORK' ? '#818cf8' : '#34d399'}
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={125.6}
              strokeDashoffset={125.6 - (125.6 * progress) / 100}
              className="transition-all duration-1000 ease-linear"
              style={{ filter: `drop-shadow(0 0 4px ${mode === 'WORK' ? '#818cf8' : '#34d399'})` }}
            />
          </svg>
          <span className="absolute text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {mode === 'WORK' ? 'Work' : 'Rest'}
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-2xl font-mono font-bold text-white tracking-tight tabular-nums">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-zinc-500 truncate max-w-[160px]">
            {activeTask ? activeTask.title : 'Select a task...'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isActive ? (
          <button
            onClick={handleStart}
            disabled={mode === 'WORK' && !activeTask}
            className={clsx(
              "p-3 rounded-full text-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]",
              mode === 'WORK' && !activeTask 
                ? "bg-zinc-700 cursor-not-allowed opacity-50" 
                : "bg-white text-black hover:scale-110 active:scale-95 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            )}
          >
            <Play size={20} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="p-3 rounded-full bg-amber-500 text-white hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:scale-110 active:scale-95"
          >
            <Pause size={20} fill="currentColor" />
          </button>
        )}
        
        <button 
           onClick={() => {
             setIsActive(false);
             setMode(mode === 'WORK' ? 'BREAK' : 'WORK');
             setTimeLeft((mode === 'WORK' ? DEFAULT_SETTINGS.breakDuration : DEFAULT_SETTINGS.workDuration) * 60);
           }}
           className="p-2 text-zinc-500 hover:text-white transition-colors"
        >
          <SkipForward size={20} />
        </button>
      </div>
    </div>
  );
};

export default Timer;