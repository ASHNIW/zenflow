import { Task } from "../types";

// This service has been converted to offline-only. 
// It no longer connects to external AI APIs.

export const getTaskAdvice = async (task: Task): Promise<string> => {
  return "Break this task down into smaller steps and start with the easiest one.";
};

export const getDailyMotivation = async (): Promise<string> => {
  const quotes = [
    "Focus on the process, not just the outcome.",
    "Small progress is still progress.",
    "Consistency is key.",
    "Do it now."
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
};