
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

import { Task, EisenhowerQuadrant, CalendarEvent } from "../types";
import { taskService } from "./taskService";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing VITE_GEMINI_API_KEY in .env");
}

const ai = new GoogleGenAI({ 
  apiKey
});
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

  generateSchedule: async (tasks: Task[], commitments: CalendarEvent[], todayDate: string) => {
    const analyzedTasks = tasks.filter(t => t.isAnalyzed && !t.isCompleted).map(t => ({
      ...t,
      quadrant: taskService.calculateQuadrant(t)
    }));

    if (analyzedTasks.length === 0) return [];

    // Find the latest deadline to know how far to plan
    const lastDeadline = analyzedTasks.reduce((latest, task) => {
      return task.deadline > latest ? task.deadline : latest;
    }, todayDate);
    
    const prompt = `Act as an expert academic coach. Create a study schedule starting from ${todayDate} until the final deadline of ${lastDeadline}.
    
    CRITICAL SCHEDULING LOGIC:
    1. TOTAL HOURS FULFILLMENT: For each task, you MUST schedule the ENTIRE "Needs Xh total" amount. If a task needs 4 hours and there are 4 days until the deadline, you must schedule exactly 4 hours total (e.g., 1 hour each day).
    2. SMART DISTRIBUTION: Distribute the total hours for each task evenly across ALL available days from ${todayDate} until its specific deadline. 
    3. SESSION DURATION RULES: 
       - DEFAULT session duration: 1 hour.
       - If total hours / available days < 1 hour, use that average (e.g., 2h total over 4 days = 30 mins/day).
       - MINIMUM session duration: 30 minutes. 
       - PREFERRED durations: 40, 45, 50, or 60 minutes.
    4. TIME SPREADING: Spread sessions throughout the day (08:00 to 21:00). Leave at least 1.5 - 3 hours of free time between sessions. Do not cluster everything in the morning.
    5. COMMITMENT PRIORITY: NEVER schedule during user commitment slots.
    6. TODAY IS: ${todayDate}. Do not schedule in the past.
    7. SUSTAINABILITY: Max 6 study hours total per day.
    8. BLOCKED TIMES: 22:00-07:00 (Sleep).

    TASKS TO SCHEDULE:
    ${analyzedTasks
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .map(t => {
        return `- [${t.quadrant}] "${t.title}" (Needs ${t.estimatedHours}h total). DUE: ${t.deadline}`;
      }).join('\n')}

    USER COMMITMENTS (Do not overlap):
    ${commitments.map(c => `- ${c.title} on ${c.date} from ${c.startTime} to ${c.endTime}`).join('\n')}

    Return a JSON array of events.
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
