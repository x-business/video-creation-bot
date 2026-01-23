import { MoreHorizontal, Trash2, Edit, Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkflowSteps } from "./workflow-steps";
import type { VideoProject } from "@shared/schema";

interface ProjectCardProps {
  project: VideoProject;
  onView: (project: VideoProject) => void;
  onDelete: (id: number) => void;
}

const platformColors: Record<string, string> = {
  reels: "bg-gradient-to-r from-pink-500 to-purple-500",
  tiktok: "bg-gradient-to-r from-cyan-500 to-blue-500",
  shorts: "bg-gradient-to-r from-red-500 to-orange-500",
};

const platformLabels: Record<string, string> = {
  reels: "Reels",
  tiktok: "TikTok",
  shorts: "Shorts",
};

export function ProjectCard({ project, onView, onDelete }: ProjectCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <Card className="hover-elevate cursor-pointer group" data-testid={`card-project-${project.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              className={`${platformColors[project.platform]} text-white border-0`}
              data-testid={`badge-platform-${project.id}`}
            >
              {platformLabels[project.platform] || project.platform}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {project.videoLength}s
            </Badge>
          </div>
          <h3 
            className="font-semibold text-base leading-tight line-clamp-2"
            data-testid={`text-project-title-${project.id}`}
          >
            {project.title}
          </h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`button-project-menu-${project.id}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(project)} data-testid={`menu-view-${project.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(project.id)} 
              className="text-destructive"
              data-testid={`menu-delete-${project.id}`}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4" onClick={() => onView(project)}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {project.purpose}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {project.tone}
          </Badge>
        </div>
        
        {project.script && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.script}
          </p>
        )}

        <WorkflowSteps project={project} />
        
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Created {formatDate(project.createdAt)}
        </div>
      </CardContent>
    </Card>
  );
}
