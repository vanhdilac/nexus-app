
import React from 'react';
import { Task, EisenhowerQuadrant, TaskImportance } from '../../types';
import { taskService } from '../../services/taskService';
import { QUADRANT_COLORS } from '../../constants';
import { Info, HelpCircle, Brain, Sparkles, AlertCircle, GripVertical } from 'lucide-react';
import { 
  DndContext, 
  DragOverlay, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface MatrixViewProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export default function MatrixView({ tasks, onUpdateTask }: MatrixViewProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
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

    if (over && active.id !== over.id) {
      const taskId = active.id as string;
      const newQuadrant = over.id as EisenhowerQuadrant;
      const task = tasks.find(t => t.id === taskId);
      
      if (task) {
        // If user drags to a new quadrant, we update the importance to match
        // since urgency is fixed by the deadline.
        const isTargetImportant = newQuadrant === EisenhowerQuadrant.DO_FIRST || newQuadrant === EisenhowerQuadrant.SCHEDULE;
        onUpdateTask(taskId, { 
          importance: isTargetImportant ? TaskImportance.HIGH : TaskImportance.LOW 
        });
      }
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">The Eisenhower Matrix</h1>
            <p className="text-slate-500 font-medium">Drag and drop tasks to change your processing strategy.</p>
          </div>
        </div>

        {/* GLOBAL INBOX */}
        {unanalyzedTasks.length > 0 && (
          <div className="bg-accent rounded-[3rem] p-10 shadow-2xl shadow-orange-100 animate-in zoom-in-95 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <Sparkles size={120} />
            </div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <HelpCircle size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Unprioritized Tasks</h3>
                <p className="text-indigo-100 text-sm font-bold opacity-80">{unanalyzedTasks.length} tasks waiting for AI analysis</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
              {unanalyzedTasks.map(task => (
                <div key={task.id} className="bg-white p-6 rounded-3xl shadow-sm border border-transparent hover:border-white transition-all group">
                  <h4 className="font-bold text-slate-800 line-clamp-1 mb-2">{task.title}</h4>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed break-words whitespace-pre-wrap">{task.description || 'No description'}</p>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                     <span className="text-[9px] font-black text-accent bg-orange-50 px-2 py-1 rounded-full uppercase">Waiting</span>
                     <Brain size={16} className="text-slate-200 group-hover:text-accent transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* THE EISENHOWER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Quadrant 
            id={EisenhowerQuadrant.DO_FIRST}
            title="Do First" 
            subtitle="Urgent & Important" 
            tasks={getTasksByQuadrant(EisenhowerQuadrant.DO_FIRST)} 
            colorClass={QUADRANT_COLORS[EisenhowerQuadrant.DO_FIRST]} 
          />
          <Quadrant 
            id={EisenhowerQuadrant.SCHEDULE}
            title="Schedule" 
            subtitle="Important, Not Urgent" 
            tasks={getTasksByQuadrant(EisenhowerQuadrant.SCHEDULE)} 
            colorClass={QUADRANT_COLORS[EisenhowerQuadrant.SCHEDULE]} 
          />
          <Quadrant 
            id={EisenhowerQuadrant.DELEGATE}
            title="Delegate" 
            subtitle="Urgent, Not Important" 
            tasks={getTasksByQuadrant(EisenhowerQuadrant.DELEGATE)} 
            colorClass={QUADRANT_COLORS[EisenhowerQuadrant.DELEGATE]} 
          />
          <Quadrant 
            id={EisenhowerQuadrant.ELIMINATE}
            title="Eliminate" 
            subtitle="Neither Urgent Nor Important" 
            tasks={getTasksByQuadrant(EisenhowerQuadrant.ELIMINATE)} 
            colorClass={QUADRANT_COLORS[EisenhowerQuadrant.ELIMINATE]} 
          />
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeTask ? (
            <div className="bg-white rounded-2xl p-5 shadow-2xl border-2 border-accent w-72 rotate-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm truncate">{activeTask.title}</span>
                <GripVertical size={16} className="text-accent" />
              </div>
            </div>
          ) : null}
        </DragOverlay>

        {tasks.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
             <h3 className="text-xl font-bold text-slate-800">Your Matrix is Empty</h3>
             <p className="text-slate-500 mt-2">Go to "Academic Tasks" to start building your academic nexus.</p>
          </div>
        )}
      </div>
    </DndContext>
  );
}

const Quadrant = ({ id, title, subtitle, tasks, colorClass }: { id: string, title: string, subtitle: string, tasks: Task[], colorClass: string }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col rounded-[3rem] p-10 border-2 min-h-[450px] transition-all relative overflow-hidden shadow-sm ${colorClass} ${isOver ? 'ring-4 ring-current ring-offset-4 scale-[1.02] z-20' : ''}`}
    >
      <div className="mb-10 relative z-10">
        <h3 className="text-3xl font-black uppercase tracking-tighter mb-1">{title}</h3>
        <p className="text-[11px] opacity-70 font-black tracking-widest uppercase">{subtitle}</p>
      </div>
      
      <div className="flex-1 space-y-4 relative z-10">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <DraggableTask key={task.id} task={task} />
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-current rounded-[2.5rem] py-12">
            <span className="text-[10px] font-black uppercase tracking-widest">Empty Sector</span>
          </div>
        )}
      </div>
    </div>
  );
};

const DraggableTask = ({ task }: { task: Task, key?: string }) => {
  const [hovered, setHovered] = React.useState(false);
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
      className="bg-white/95 backdrop-blur rounded-2xl p-5 shadow-sm relative group cursor-grab active:cursor-grabbing border border-transparent hover:border-current/30 transition-all hover:-translate-y-0.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <GripVertical size={14} className="text-slate-300 group-hover:text-slate-400 shrink-0" />
          <span className="font-bold text-slate-800 text-sm truncate">{task.title}</span>
        </div>
        <Info size={16} className="text-slate-300 group-hover:text-accent transition-colors shrink-0" />
      </div>

      {hovered && !isDragging && (
        <div className="mt-3 bg-slate-900 text-white p-6 rounded-[2rem] text-sm shadow-2xl animate-in fade-in slide-in-from-top-4">
          <p className="font-black text-accent uppercase tracking-widest text-[10px] mb-2">AI Reasoning</p>
          <p className="leading-relaxed font-medium text-slate-200 italic">"{task.reasoning}"</p>
        </div>
      )}
    </div>
  );
};
