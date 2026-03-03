
import { Task, EisenhowerQuadrant, TaskImportance } from '../types';

export const taskService = {
  /**
   * Calculates if a task is urgent based on its deadline.
   * Deadline <= 3 days from now is considered urgent.
   */
  calculateUrgency: (task: Task): boolean => {
    if (!task.deadline) return false;
    
    const now = new Date();
    const deadlineDate = new Date(task.deadline);
    
    // Set both to start of day for accurate day-based comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // If deadline is today, tomorrow, or within 3 days
    return diffDays <= 3;
  },

  /**
   * Determines the Eisenhower Quadrant for a task dynamically.
   * This implements "State Derivation" - the quadrant is a function of (task, now).
   */
  calculateQuadrant: (task: Task): EisenhowerQuadrant => {
    const isUrgent = taskService.calculateUrgency(task);
    const isImportant = task.importance === TaskImportance.HIGH || task.importance === TaskImportance.MEDIUM;

    if (isUrgent && isImportant) return EisenhowerQuadrant.DO_FIRST;
    if (!isUrgent && isImportant) return EisenhowerQuadrant.SCHEDULE;
    if (isUrgent && !isImportant) return EisenhowerQuadrant.DELEGATE;
    return EisenhowerQuadrant.ELIMINATE;
  },

  /**
   * Derivation vs Storage:
   * Why this is correct according to State Derivation architecture:
   * 1. Single Source of Truth: The 'deadline' and 'importance' are the raw data. 
   *    The 'quadrant' is a computed view of that data.
   * 2. Consistency: As time passes, a task naturally moves from 'Schedule' to 'Do First' 
   *    without needing a manual database update.
   * 3. Reduced Complexity: No need to sync 'quadrant' across multiple components or 
   *    handle complex update logic when the clock ticks.
   */
};
