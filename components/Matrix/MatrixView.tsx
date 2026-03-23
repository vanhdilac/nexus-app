import React, { useRef } from 'react';
import { Task, EisenhowerQuadrant } from '../../types';
import { taskService } from '../../services/taskService';
import { QUADRANT_CONFIG } from '../../constants';
import { GripVertical } from 'lucide-react';
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
  // Ref để theo dõi 4 ô quadrant
  const quadrantRefs = useRef<{ [key in EisenhowerQuadrant]?: HTMLDivElement | null }>({});
  
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
      
      // 1. Cập nhật dữ liệu
      onUpdateTask(taskId, { 
        manualQuadrant: newQuadrant,
        isAnalyzed: true
      });

      // 2. Scroll đến ô mới và căn giữa màn hình
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">The Eisenhower Matrix</h1>
            <p className="text-slate-500 font-medium">Drag and drop tasks to change your processing strategy.</p>
          </div>
        </div>

        {/* BOX CHỨA TASK CHƯA PHÂN LOẠI */}
        {unanalyzedTasks.length > 0 && (
          <div className="bg-slate-50 rounded-[3rem] p-10 border-2 border-dashed border-slate-200">
             <div className="flex flex-wrap gap-4">
                {unanalyzedTasks.map(task => (
                  <DraggableTask key={task.id} task={task} />
                ))}
             </div>
          </div>
        )}

        {/* 4 Ô MA TRẬN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[
            EisenhowerQuadrant.DO_FIRST,
            EisenhowerQuadrant.SCHEDULE,
            EisenhowerQuadrant.DELEGATE,
            EisenhowerQuadrant.ELIMINATE
          ].map((q) => (
            <Quadrant 
              key={q} 
              id={q} 
              tasks={getTasksByQuadrant(q)}
              // Gán ref cho từng quadrant
              ref={(el) => { quadrantRefs.current[q] = el; }}
            />
          ))}
        </div>
      </div>

      {/* Overlay khi đang kéo - Tắt animation drop để không bị giật ngược */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="bg-white/95 backdrop-blur rounded-2xl p-5 shadow-xl border-2 border-primary/20 w-[280px]">
            <div className="flex items-center gap-3">
              <GripVertical size={14} className="text-slate-400" />
              <span className="font-bold text-slate-900 truncate">{activeTask.title}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

const Quadrant = React.forwardRef<HTMLDivElement, { id: EisenhowerQuadrant; tasks: Task[] }>(
  ({ id, tasks }, ref) => {
    const { isOver, setNodeRef } = useDroppable({ id });
    const config = QUADRANT_CONFIG[id];
    const Icon = config.icon;

    return (
      <div 
        ref={(node) => {
          setNodeRef(node);
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as any).current = node;
        }}
        className={`rounded-[3.5rem] p-10 transition-all duration-300 border-4 min-h-[400px] flex flex-col ${
          isOver 
            ? `${config.bg} ${config.border} scale-[1.02] shadow-2xl` 
            : `bg-white border-slate-100`
        }`}
      >
        <div className={`flex items-center gap-4 mb-8 ${config.text}`}>
          <div className={`p-4 rounded-[1.5rem] ${config.bg} shadow-sm`}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">{config.title}</h3>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">{config.subtitle}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-wrap gap-4 content-start">
          {tasks.map((task) => (
            <DraggableTask key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-current rounded-[2.5rem] py-12 w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Empty Sector</span>
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
    // Khi đang kéo, ẩn task ở vị trí cũ hoàn toàn (xóa bóng ma)
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white/95 backdrop-blur rounded-2xl p-5 shadow-sm relative group cursor-grab active:cursor-grabbing border border-slate-100 hover:border-current/30 transition-all w-[280px]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <GripVertical size={14} className="text-slate-300 group-hover:text-current shrink-0" />
          <span className="font-bold text-slate-900 truncate text-sm">{task.title}</span>
        </div>
      </div>
    </div>
  );
};