
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

import { Task, EisenhowerQuadrant, CalendarEvent } from "../types";
import { taskService } from "./taskService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const key = import.meta.env.VITE_GEMINI_API_KEY || ""; 
console.log("ENV KEY:", import.meta.env.VITE_GEMINI_API_KEY);
// const ai = new GoogleGenAI(AIzaSyB6OGpMPyIh1B7_2Aa9dwOu5aX6DKvYo10);

export const geminiService = {
  classifyTask: async (task: Task, answers: { urgency: string, importance: string, pressure: string }) => {
    const prompt = `Analyze this academic task and classify it into exactly one of these four categories:
    - "Do First" (High Urgency & High Importance)
    - "Schedule" (Low Urgency & High Importance)
    - "Delegate" (High Urgency & Low Importance)
    - "Eliminate" (Low Urgency & Not Important)

    Task Title: ${task.title}
    Description: ${task.description}
    General Deadline: ${task.deadline}
    Specific Exam Date: ${task.examDate || 'None set'}
    Difficulty: ${task.difficulty}
    Importance Level: ${task.importance}
    
    Student's Input:
    - Urgency Sense: ${answers.urgency}
    - Importance Sense: ${answers.importance}
    - Emotional Pressure: ${answers.pressure}

    CRITICAL: If there is an Exam Date set and it is within the next 7 days, the task should almost certainly be "Do First".

    Return a JSON object with 'quadrant' and 'reasoning' (a helpful explanation).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quadrant: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["quadrant", "reasoning"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as { quadrant: EisenhowerQuadrant, reasoning: string };
  },

  bulkClassifyTasks: async (tasks: Task[]) => {
    const prompt = `Act as an expert academic strategist. Analyze the tasks and classify each into: "Do First", "Schedule", "Delegate", "Eliminate".
    
    TASKS:
    ${tasks.map(t => `- [ID: ${t.id}] Title: ${t.title}, Deadline: ${t.deadline}, Exam: ${t.examDate || 'N/A'}, Difficulty: ${t.difficulty}, Importance: ${t.importance}`).join('\n')}

    Rules:
    - Return a JSON array of objects.
    - Each object must include: taskId, quadrant, and reasoning.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              taskId: { type: Type.STRING },
              quadrant: { type: Type.STRING },
              reasoning: { type: Type.STRING }
            },
            required: ["taskId", "quadrant", "reasoning"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]') as { taskId: string, quadrant: EisenhowerQuadrant, reasoning: string }[];
  },

  generateSchedule: async (tasks: Task[], commitments: CalendarEvent[], weekStartDate: string, todayDate: string) => {
    const analyzedTasks = tasks.filter(t => t.isAnalyzed).map(t => ({
      ...t,
      quadrant: taskService.calculateQuadrant(t)
    }));
    
    const prompt = `Act as an expert academic coach. Create a 7-DAY study schedule starting from ${weekStartDate}.
    
    CRITICAL SCHEDULING LOGIC:
    1. DEADLINE PRIORITY: Deadlines are the absolute priority. A task due on Feb 4 MUST be scheduled before a task due on Feb 5.
    2. TODAY IS: ${todayDate}. Do not schedule anything in the past.
    3. QUADRANT TIE-BREAKER: If two tasks have the same deadline, schedule "Do First" tasks before "Schedule" tasks.
    4. SUSTAINABILITY: Max 3 study sessions (3 hours total) per day.

    CONSTRAINTS:
    - SLOT DURATION: Each session MUST be 1 hour.
    - BREAKS: 15-min gap between slots.
    - FORMAT: YYYY-MM-DD.
    - BLOCKED: 12:00-13:00 (Lunch), 17:00-18:00 (Dinner), and 22:00-07:00 (Sleep).
    
    TASKS TO SCHEDULE:
    ${analyzedTasks
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .map(t => `- [${t.quadrant}] "${t.title}" (Needs ${t.estimatedHours}h). DUE: ${t.deadline}`).join('\n')}

    USER COMMITMENTS (Do not overlap):
    ${commitments.map(c => `- ${c.title} on ${c.date} from ${c.startTime} to ${c.endTime}`).join('\n')}

    Return a JSON array of events for the NEXT 7 DAYS from ${weekStartDate}.
    Each event: taskId, title, startTime (HH:mm), endTime (HH:mm), date (YYYY-MM-DD).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              taskId: { type: Type.STRING },
              title: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              date: { type: Type.STRING, description: 'Format YYYY-MM-DD' }
            },
            required: ["taskId", "title", "startTime", "endTime", "date"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]') as Omit<CalendarEvent, 'id' | 'userId' | 'day'>[];
  }
};
