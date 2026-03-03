
import { Task, CalendarEvent, EisenhowerQuadrant } from '../types';

export const schedulerService = {
  autoSchedule: (tasks: Task[], existingEvents: CalendarEvent[], weekStart: Date, userId: string): CalendarEvent[] => {
    // 1. Filter uncompleted and analyzed tasks
    const pendingTasks = tasks.filter(t => t.isAnalyzed && !t.isCompleted);
    
    // 2. Sort by Deadline (Ascending) - Deadline-Proximity Strategy
    const sortedTasks = [...pendingTasks].sort((a, b) => {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    const newEvents: CalendarEvent[] = [];
    const occupiedSlots: Record<string, Set<number>> = {};
    const tasksPerDay: Record<string, number> = {};

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentSlot = (currentHour - 7) * 2 + (currentMin >= 30 ? 1 : 0);

    weekDays.forEach(date => {
      occupiedSlots[date] = new Set<number>();
      tasksPerDay[date] = 0;
    });

    // Helper to mark slots as occupied
    const markOccupied = (date: string, start: string, end: string) => {
      if (!occupiedSlots[date]) occupiedSlots[date] = new Set();
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      
      const startSlot = (sh - 7) * 2 + (sm === 30 ? 1 : 0);
      const endSlot = (eh - 7) * 2 + (em === 30 ? 1 : 0);
      
      for (let s = startSlot; s < endSlot; s++) {
        occupiedSlots[date].add(s);
      }
      // Add a 30-minute gap (1 slot) after each event to satisfy the "at least 10 min break" rule
      if (endSlot < 30) {
        occupiedSlots[date].add(endSlot);
      }
    };

    // Pre-fill occupied slots with existing commitments and already scheduled tasks
    existingEvents.forEach(e => {
      // Single event
      if (occupiedSlots[e.date]) {
        markOccupied(e.date, e.startTime, e.endTime);
      }
      
      // Recurring event
      if (e.isRecurring && e.recurrence) {
        weekDays.forEach(dateStr => {
          const eventStart = new Date(e.date);
          const currentDay = new Date(dateStr);
          
          if (currentDay >= eventStart && (!e.recurrence?.endDate || currentDay <= new Date(e.recurrence.endDate))) {
            if (e.recurrence?.frequency === 'daily' || (e.recurrence?.frequency === 'weekly' && e.recurrence.daysOfWeek?.includes(currentDay.getDay()))) {
              markOccupied(dateStr, e.startTime, e.endTime);
            }
          }
        });
      }
    });

    // Forbidden slots: 11:00-13:00 (slots 8-11) and 17:00-19:00 (slots 20-23)
    const forbiddenSlots = new Set([8, 9, 10, 11, 20, 21, 22, 23]);

    const tryScheduleTask = (task: Task, targetDays: string[], isProximityPass: boolean, hoursToSchedule: number): boolean => {
      const slotsNeeded = Math.ceil(hoursToSchedule * 2);
      const deadlineDate = new Date(task.deadline);
      const safeDeadline = new Date(deadlineDate.getTime() - 3 * 60 * 60 * 1000); // 3h safety buffer
      const windowStart = new Date(deadlineDate.getTime() - 72 * 60 * 60 * 1000); // 72h proximity window

      // Sort days to be closer to deadline if proximity pass, or earlier if fallback
      const daysToTry = isProximityPass ? [...targetDays].reverse() : targetDays;

      for (const dateStr of daysToTry) {
        if (dateStr < todayStr) continue;
        if (tasksPerDay[dateStr] >= 4) continue; // Increased limit slightly since blocks are smaller

        // Slots from 07:00 to 22:00 (0 to 29)
        const slots = Array.from({ length: 30 - slotsNeeded + 1 }, (_, i) => i);
        // If proximity, try later slots first
        if (isProximityPass) slots.reverse();

        for (const startSlot of slots) {
          if (dateStr === todayStr && startSlot <= currentSlot) continue;

          // Check forbidden slots (Lunch/Dinner)
          const isForbidden = Array.from({ length: slotsNeeded }, (_, i) => startSlot + i)
            .some(s => forbiddenSlots.has(s));
          if (isForbidden) continue;

          const sh = Math.floor(startSlot / 2) + 7;
          const sm = (startSlot % 2) * 30;
          const eh = Math.floor((startSlot + slotsNeeded) / 2) + 7;
          const em = ((startSlot + slotsNeeded) % 2) * 30;

          const startTime = `${sh.toString().padStart(2, '0')}:${sm.toString().padStart(2, '0')}`;
          const endTime = `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;
          
          const startDateTime = new Date(`${dateStr}T${startTime}`);
          const endDateTime = new Date(`${dateStr}T${endTime}`);

          // Check Safety Buffer: Must end at least 3 hours before deadline
          if (endDateTime > safeDeadline) continue;

          // Check Proximity Window if in proximity pass
          if (isProximityPass && startDateTime < windowStart) continue;

          const canFit = Array.from({ length: slotsNeeded + 1 }, (_, i) => startSlot + i)
            .every(s => s >= 30 || !occupiedSlots[dateStr].has(s));

          if (canFit) {
            const newEvent: CalendarEvent = {
              id: crypto.randomUUID(),
              userId,
              taskId: task.id,
              title: task.title + (hoursToSchedule < task.estimatedHours ? ` (Session)` : ''),
              date: dateStr,
              startTime,
              endTime,
              day: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' }),
              isCommitment: false
            };

            newEvents.push(newEvent);
            for (let s = startSlot; s < startSlot + slotsNeeded + 1; s++) {
              if (s < 30) occupiedSlots[dateStr].add(s);
            }
            tasksPerDay[dateStr]++;
            return true;
          }
        }
      }
      return false;
    };

    // Process each task with Deadline-Proximity strategy and 1h block constraint
    for (const task of sortedTasks) {
      let remainingHours = task.estimatedHours || 1;
      
      while (remainingHours > 0) {
        const hoursToSchedule = Math.min(remainingHours, 1); // Max 1h per block
        
        // Pass 1: Proximity Window (72h before deadline)
        let scheduled = tryScheduleTask(task, weekDays, true, hoursToSchedule);
        
        if (!scheduled) {
          // Pass 2: Fallback (Anytime before 3h buffer)
          scheduled = tryScheduleTask(task, weekDays, false, hoursToSchedule);
        }

        if (!scheduled) break; // Could not schedule this block, move to next task
        remainingHours -= hoursToSchedule;
      }
    }

    return newEvents;
  }
};
