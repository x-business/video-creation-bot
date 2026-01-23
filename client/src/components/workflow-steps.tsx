import { Check, Circle, Sparkles, Image, Video, Volume2, Scissors } from "lucide-react";
import type { VideoProject } from "@shared/schema";

interface WorkflowStepsProps {
  project: VideoProject;
}

const steps = [
  { key: "hookGenerated", label: "Hook", icon: Sparkles },
  { key: "script", label: "Script", icon: Circle, checkFn: (p: VideoProject) => !!p.script },
  { key: "imageGenerated", label: "Image", icon: Image },
  { key: "videoGenerated", label: "Video", icon: Video },
  { key: "audioGenerated", label: "Audio", icon: Volume2 },
  { key: "editingComplete", label: "Editing", icon: Scissors },
] as const;

export function WorkflowSteps({ project }: WorkflowStepsProps) {
  const getStepStatus = (step: typeof steps[number]) => {
    if (step.checkFn) {
      return step.checkFn(project);
    }
    return project[step.key as keyof VideoProject] === true;
  };

  const completedCount = steps.filter(s => getStepStatus(s)).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Workflow Progress</span>
        <span className="text-xs font-medium text-primary">{completedCount}/{steps.length}</span>
      </div>
      <div className="flex items-center gap-1">
        {steps.map((step, index) => {
          const isComplete = getStepStatus(step);
          const Icon = step.icon;
          
          return (
            <div key={step.key} className="flex items-center flex-1">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-md transition-all
                  ${isComplete 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                  }
                `}
                title={step.label}
              >
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div 
                  className={`
                    flex-1 h-0.5 mx-1 rounded-full transition-all
                    ${isComplete ? "bg-primary" : "bg-muted"}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between">
        {steps.map((step) => (
          <span 
            key={step.key}
            className={`
              text-[10px] font-medium flex-1 text-center
              ${getStepStatus(step) ? "text-primary" : "text-muted-foreground"}
            `}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}
