import { Video, Sparkles } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Video className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-accent-foreground" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        Create your first video project to start generating AI-powered scripts and organizing your content workflow.
      </p>
    </div>
  );
}
