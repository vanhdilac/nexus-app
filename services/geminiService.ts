
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

import { Task, EisenhowerQuadrant, CalendarEvent } from "../types";
import { taskService } from "./taskService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
// const key = import.meta.env.VITE_GEMINI_API_KEY || ""; 
// const aiInstance = new GoogleGenAI({ apiKey: key });

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
    
    CRITICAL SCHEDULING LOGIC (SPACED LEARNING):
    1. SPACED LEARNING: For each task, spread the required study hours EVENLY across the days from the task's creation date until its deadline. 
       - Example: If a task was created on March 18 and is due on March 21 (3 days gap), and needs 3 hours, schedule 1 hour on the 18th, 1 hour on the 19th, and 1 hour on the 20th.
       - DO NOT cluster all hours on the day before the deadline.
    2. COMMITMENT PRIORITY: Scan user commitments first. NEVER schedule academic tasks during commitment slots.
    3. DEADLINE PROXIMITY: If a slot is taken by a commitment, find the NEAREST available free slot.
    4. TODAY IS: ${todayDate}. Do not schedule anything in the past.
    5. SUSTAINABILITY: Max 4 study sessions (4 hours total) per day.

    CONSTRAINTS:
    - SLOT DURATION: Each session MUST be 1 hour.
    - BREAKS: 30-min gap between slots.
    - FORMAT: YYYY-MM-DD.
    - BLOCKED: 11:00-13:00 (Lunch), 17:00-19:00 (Dinner), and 22:00-07:00 (Sleep).
    
    TASKS TO SCHEDULE:
    ${analyzedTasks
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .map(t => {
        const createdDate = new Date(t.createdAt).toISOString().split('T')[0];
        return `- [${t.quadrant}] "${t.title}" (Needs ${t.estimatedHours}h). CREATED: ${createdDate}, DUE: ${t.deadline}`;
      }).join('\n')}

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
  },

  generateMotivationalQuote: async () => {
    const prompt = `Generate a short, powerful motivational quote in English for a student. 
    Focus on academic success, perseverance, and focus. 
    Return a JSON object with 'quote' and 'author'.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING },
            author: { type: Type.STRING }
          },
          required: ["quote", "author"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as { quote: string, author: string };
  }
};
