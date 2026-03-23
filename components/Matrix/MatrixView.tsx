import React, { useRef } from 'react';
import { Task, EisenhowerQuadrant } from '../../types';
import { taskService } from '../../services/taskService';
import { QUADRANT_COLORS } from '../../constants';
import { HelpCircle, Sparkles, GripVertical, Sun, Moon } from 'lucide-react';
import { 
  DndContext, 
  DragOverlay, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface MatrixViewProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export default function MatrixView({ tasks, onUpdateTask }: MatrixViewProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const quadrantRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getTasksByQuadrant = (q: EisenhowerQuadrant) => 
    tasks.filter(t => taskService.calculateQuadrant(t) === q && t.isAnalyzed);
  
  const unanalyzedTasks = tasks.filter(t => !t.isAnalyzed);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over) {
      const taskId = active.id as string;
      const newQuadrant = over.id as EisenhowerQuadrant;
      
      onUpdateTask(taskId, { 
        manualQuadrant: newQuadrant,
        isAnalyzed: true
      });

      setTimeout(() => {
        const targetElement = quadrantRefs.current[newQuadrant];
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 50);
    }
  };

  const activeTask = tasks.find(t => t.id === activeId);

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">The Eisenhower Matrix</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Drag and drop tasks to change your processing strategy.</p>
          </div>
        </div>

        {unanalyzedTasks.length > 0 && (
          <div className="bg-accent rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <Sparkles size={120} />
            </div>
            <div className="flex items-center gap-4 mb-8 relative z-10 text-left text-white">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <HelpCircle size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Unprioritized Tasks</h3>
                <p className="text-indigo-100 text-sm font-bold opacity-80">{unanalyzedTasks.length} tasks waiting for AI analysis</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 relative z-10">
              {unanalyzedTasks.map(task => (
                <DraggableTask key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Quadrant 
            id={EisenhowerQuadrant.DO_FIRST}
            title="Do First" 
            subtitle="Urgent & Important" 
            tasks={getTasksByQuadrant(EisenhowerQuadrant.DO_FIRST)} 
            colorClass={String(QUADRANT_COLORS[EisenhowerQuadrant.DO_FIRST])} 
            ref={(el) => (quadrantRefs.current[EisenhowerQuadrant.DO_FIRST] = el)}
          />
          <Quadrant 
            id={EisenhowerQuadrant.SCHEDULE}
            title="Schedule" 
            subtitle="Important, Not Urgent" 
            tasks={getTasksByQuadrant(EisenhowerQuadrant.SCHEDULE)} 
            colorClass={String(QUADRANT_COLORS[EisenhowerQuadrant.SCHEDULE])} 
            ref={(el) => (quadrantRefs.current[EisenhowerQuadrant.SCHEDULE] = el)}
          />
          <Quadrant 
            id={EisenhowerQuadrant.DELEGATE}
            title="Delegate" 
            subtitle="Urgent, Not Important" 
            tasks={getTasksByQuadrant(EisenhowerQuadrant.DELEGATE)} 
            colorClass={String(QUADRANT_COLORS[EisenhowerQuadrant.DELEGATE])} 
            ref={(el) => (quadrantRefs.current[EisenhowerQuadrant.DELEGATE] = el)}
          />
          <Quadrant 
            id={EisenhowerQuadrant.ELIMINATE}
            title="Eliminate" 
            subtitle="Neither Urgent Nor Important" 
            tasks={getTasksByQuadrant(EisenhowerQuadrant.ELIMINATE)} 
            colorClass={String(QUADRANT_COLORS[EisenhowerQuadrant.ELIMINATE])} 
            ref={(el) => (quadrantRefs.current[EisenhowerQuadrant.ELIMINATE] = el)}
          />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-2xl border border-slate-100 dark:border-slate-700 w-[280px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{activeTask.title}</span>
                <GripVertical size={16} className="text-slate-400" />
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

const Quadrant = React.forwardRef<HTMLDivElement, { id: string, title: string, subtitle: string, tasks: Task[], colorClass: string }>(
  ({ id, title, subtitle, tasks, colorClass }, ref) => {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
      <div 
        ref={(node) => {
          setNodeRef(node);
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as any).current = node;
        }}
        className={`flex flex-col rounded-[3rem] p-10 border-2 min-h-[450px] transition-all relative overflow-hidden shadow-sm text-left ${colorClass} ${isOver ? 'ring-4 ring-current ring-offset-4 scale-[1.02] z-20' : ''}`}
      >
        <div className="mb-10 relative z-10">
          <h3 className="text-3xl font-black uppercase tracking-tighter mb-1">{title}</h3>
          <p className="text-[11px] opacity-70 font-black tracking-widest uppercase">{subtitle}</p>
        </div>
        
        <div className="flex-1 flex flex-wrap gap-4 content-start relative z-10">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <DraggableTask key={task.id} task={task} />
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-current rounded-[2.5rem] py-12 w-full">
              <span className="text-[10px] font-black uppercase tracking-widest">Empty Sector</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

const DraggableTask = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm relative group cursor-grab active:cursor-grabbing border border-slate-100 dark:border-slate-700 transition-all w-[280px]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <GripVertical size={14} className="text-slate-300 dark:text-slate-500 shrink-0" />
          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{task.title}</span>
        </div>
      </div>
    </div>
  );
};