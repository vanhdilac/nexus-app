
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
      // return d.toISOString().split('T')[0];
      return d.toLocaleDateString('en-CA');
    });

    // const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toLocaleDateString('en-CA'); 
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    // const currentSlot = (currentHour - 7) * 2 + (currentMin >= 30 ? 1 : 0);
    let currentSlot = (currentHour - 7) * 2 + (currentMin >= 30 ? 1 : 0);
    if (currentSlot < 0) currentSlot = -1;

    weekDays.forEach(date => {
      occupiedSlots[date] = new Set<number>();
      tasksPerDay[date] = 0;
    });

    // Helper to mark slots as occupied
    const markOccupied = (date: string, start: string, end: string) => {
      if (!occupiedSlots[date]) occupiedSlots[date] = new Set();
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      
      const startTotalMins = (sh - 7) * 60 + sm;
      const endTotalMins = (eh - 7) * 60 + em;
      
      const startSlot = Math.floor(startTotalMins / 30);
      const endSlot = Math.floor((endTotalMins - 1) / 30);
      
      for (let s = startSlot; s <= endSlot; s++) {
        if (s >= 0 && s < 30) {
          occupiedSlots[date].add(s);
        }
      }
      // Add a 30-minute gap (1 slot) after each event to satisfy the "at least 10 min break" rule
      const gapSlot = endSlot + 1;
      if (gapSlot >= 0 && gapSlot < 30) {
        occupiedSlots[date].add(gapSlot);
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

      // Sort days: If proximity pass, try days closer to deadline first (within window).
      // If fallback, try all days before deadline.
      const daysToTry = [...targetDays]
        // .filter(d => {
        //   const dayDate = new Date(d);
        //   if (dayDate >= deadlineDate) return false;
        //   if (isProximityPass) {
        //     // In proximity pass, only consider days that overlap with the 72h window
        //     // A day overlaps if its end (23:59) is after windowStart and its start (00:00) is before deadline
        //     const dayEnd = new Date(dayDate.getTime() + 24 * 60 * 60 * 1000 - 1);
        //     return dayEnd >= windowStart;
        //   }
        //   return true;
        // })
        .filter(d => {
          const dayDate = new Date(d);
          const deadlineDay = new Date(deadlineDate);

            dayDate.setHours(0, 0, 0, 0);
            deadlineDay.setHours(0, 0, 0, 0);

          if (dayDate >= deadlineDay) return false;

          if (isProximityPass) {
          const dayEnd = new Date(dayDate.getTime() + 24 * 60 * 60 * 1000 - 1);
          return dayEnd >= windowStart;
          }

          return true;
          })
        .sort((a, b) => {
          // Both passes prioritize days closer to deadline
          const distA = Math.abs(new Date(a).getTime() - deadlineDate.getTime());
          const distB = Math.abs(new Date(b).getTime() - deadlineDate.getTime());
          return distA - distB;
        });

      for (const dateStr of daysToTry) {
        if (dateStr < todayStr) continue;
        if (tasksPerDay[dateStr] >= 5) continue;

        // Try later slots first to be closer to deadline
        const slots = Array.from({ length: 30 - slotsNeeded + 1 }, (_, i) => i).reverse();

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

          // const canFit = Array.from({ length: slotsNeeded + 1 }, (_, i) => startSlot + i)
          //   .every(s => s >= 30 || !occupiedSlots[dateStr].has(s));
          const canFit = Array.from({ length: slotsNeeded + 1 }, (_, i) => startSlot + i)
            .every(s => s < 30 && !occupiedSlots[dateStr].has(s));

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

    // Process each task with Spaced Learning strategy
    for (const task of sortedTasks) {
      let remainingHours = task.estimatedHours || 1;
      
      // Calculate days available from creation to deadline
      const creationDate = new Date(task.createdAt);
      creationDate.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(task.deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      
      // Filter weekDays that are between creation and deadline
      const availableDays = weekDays.filter(d => {
        const dayDate = new Date(d);
        return dayDate >= creationDate && dayDate < deadlineDate;
      });

      if (availableDays.length === 0) {
        availableDays.push(...weekDays.filter(d => new Date(d) < deadlineDate));
      }

      // Spread hours across available days
      const hoursPerDay = Math.ceil(remainingHours / availableDays.length);
      
      for (const dateStr of availableDays) {
        if (remainingHours <= 0) break;
        
        let scheduledToday = 0;
        const maxToday = Math.min(hoursPerDay, remainingHours);
        
        while (scheduledToday < maxToday && remainingHours > 0) {
          const scheduled = tryScheduleTask(task, [dateStr], false, 1);
          if (scheduled) {
            scheduledToday++;
            remainingHours--;
          } else {
            break;
          }
        }
      }
      
      while (remainingHours > 0) {
        const scheduled = tryScheduleTask(task, weekDays, false, 1);
        if (!scheduled) break;
        remainingHours--;
      }
    }

    return newEvents;
  }
};
