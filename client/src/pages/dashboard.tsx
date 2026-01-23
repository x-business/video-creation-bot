import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Video, Sparkles, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { ProjectCard } from "@/components/project-card";
import { ProjectDetailDialog } from "@/components/project-detail-dialog";
import { ProjectSkeleton } from "@/components/project-skeleton";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { VideoProject } from "@shared/schema";

export default function Dashboard() {
  const [selectedProject, setSelectedProject] = useState<VideoProject | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery<VideoProject[]>({
    queryKey: ["/api/projects"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project deleted",
        description: "The project has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleViewProject = (project: VideoProject) => {
    setSelectedProject(project);
    setDetailOpen(true);
  };

  const handleDeleteProject = (id: number) => {
    deleteMutation.mutate(id);
  };

  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => !p.editingComplete).length,
    completed: projects.filter(p => p.editingComplete).length,
    scriptsGenerated: projects.filter(p => p.script).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-none">VideoFlow</h1>
              <p className="text-xs text-muted-foreground">AI Workflow Automation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CreateProjectDialog />
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="hover-elevate">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                <Video className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-stat-total">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Projects</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-stat-in-progress">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-stat-completed">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-purple-500/10">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-stat-scripts">{stats.scriptsGenerated}</p>
                <p className="text-xs text-muted-foreground">Scripts Generated</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Projects</h2>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <ProjectSkeleton key={i} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onView={handleViewProject}
                  onDelete={handleDeleteProject}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <ProjectDetailDialog
        project={selectedProject}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
