import { useState, useEffect } from "react";
import { Wand2, Loader2, Copy, Check, Sparkles, Image, Video, Volume2, Scissors, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { VideoProject } from "@shared/schema";

interface ProjectDetailDialogProps {
  project: VideoProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const platformColors: Record<string, string> = {
  reels: "bg-gradient-to-r from-pink-500 to-purple-500",
  tiktok: "bg-gradient-to-r from-cyan-500 to-blue-500",
  shorts: "bg-gradient-to-r from-red-500 to-orange-500",
};

export function ProjectDetailDialog({ project, open, onOpenChange }: ProjectDetailDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [localProject, setLocalProject] = useState<VideoProject | null>(project);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setLocalProject(project);
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<VideoProject> }) => {
      return apiRequest("PATCH", `/api/projects/${id}`, updates);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      if (localProject) {
        setLocalProject({ ...localProject, ...variables.updates });
      }
    },
  });

  if (!localProject) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard.`,
    });
  };

  const handleGenerateScript = async () => {
    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/generate-script", {
        purpose: localProject.purpose,
        tone: localProject.tone,
        keyPhrase: localProject.keyPhrase,
        keyword: localProject.keyword,
        videoLength: localProject.videoLength,
      });

      const data = await response.json();

      const updates = {
        script: data.script,
        imagePrompt: data.imagePrompt,
        videoPrompt: data.videoPrompt,
      };

      await updateMutation.mutateAsync({
        id: localProject.id,
        updates,
      });

      setLocalProject({ ...localProject, ...updates });

      toast({
        title: "Script generated!",
        description: "Your AI-generated script is ready.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChecklistChange = (key: string, checked: boolean) => {
    const updates = { [key]: checked };
    updateMutation.mutate({
      id: localProject.id,
      updates,
    });
    setLocalProject({ ...localProject, ...updates });
  };

  const checklistItems = [
    { key: "hookGenerated", label: "Hook Generated", icon: Sparkles, link: "https://transitionalhooks.com" },
    { key: "imageGenerated", label: "Image Created", icon: Image },
    { key: "videoGenerated", label: "Video Generated", icon: Video },
    { key: "audioGenerated", label: "Audio Generated", icon: Volume2 },
    { key: "editingComplete", label: "Editing Complete", icon: Scissors },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${platformColors[localProject.platform]} text-white border-0`}>
              {localProject.platform}
            </Badge>
            <Badge variant="outline">{localProject.videoLength}s</Badge>
            <Badge variant="secondary">{localProject.purpose}</Badge>
            <Badge variant="secondary">{localProject.tone}</Badge>
          </div>
          <DialogTitle className="text-xl mt-2" data-testid="text-project-detail-title">
            {localProject.title}
          </DialogTitle>
          <DialogDescription>
            Manage your video content and track workflow progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {(localProject.keyPhrase || localProject.keyword) && (
            <div className="flex flex-wrap gap-2">
              {localProject.keyPhrase && (
                <Badge variant="outline" className="text-sm">
                  Key phrase: "{localProject.keyPhrase}"
                </Badge>
              )}
              {localProject.keyword && (
                <Badge variant="outline" className="text-sm">
                  Keyword: {localProject.keyword}
                </Badge>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Script</Label>
              {!localProject.script && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateScript}
                  disabled={isGenerating}
                  data-testid="button-generate-script-detail"
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Generate with AI
                </Button>
              )}
            </div>
            {localProject.script ? (
              <div className="relative">
                <div className="bg-muted rounded-md p-4 text-sm whitespace-pre-wrap" data-testid="text-script">
                  {localProject.script}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(localProject.script!, "Script")}
                  data-testid="button-copy-script"
                >
                  {copied === "Script" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No script yet. Click "Generate with AI" to create one.
              </p>
            )}
          </div>

          {localProject.imagePrompt && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Image Prompt</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(localProject.imagePrompt!, "Image Prompt")}
                  data-testid="button-copy-image-prompt"
                >
                  {copied === "Image Prompt" ? (
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Copy
                </Button>
              </div>
              <div className="bg-muted rounded-md p-4 text-sm whitespace-pre-wrap" data-testid="text-image-prompt">
                {localProject.imagePrompt}
              </div>
            </div>
          )}

          {localProject.videoPrompt && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Video Prompt</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(localProject.videoPrompt!, "Video Prompt")}
                  data-testid="button-copy-video-prompt"
                >
                  {copied === "Video Prompt" ? (
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Copy
                </Button>
              </div>
              <div className="bg-muted rounded-md p-4 text-sm whitespace-pre-wrap" data-testid="text-video-prompt">
                {localProject.videoPrompt}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-semibold">Workflow Checklist</Label>
            <p className="text-sm text-muted-foreground">
              Track your progress through each step of the workflow.
            </p>
            <div className="space-y-3">
              {checklistItems.map((item) => {
                const Icon = item.icon;
                const isChecked = localProject[item.key as keyof VideoProject] === true;
                
                return (
                  <div
                    key={item.key}
                    className={`
                      flex items-center justify-between p-3 rounded-md border
                      ${isChecked ? "bg-primary/5 border-primary/20" : "bg-card"}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={item.key}
                        checked={isChecked}
                        onCheckedChange={(checked) => 
                          handleChecklistChange(item.key, checked as boolean)
                        }
                        data-testid={`checkbox-${item.key}`}
                      />
                      <Icon className={`h-4 w-4 ${isChecked ? "text-primary" : "text-muted-foreground"}`} />
                      <Label
                        htmlFor={item.key}
                        className={`cursor-pointer ${isChecked ? "text-primary font-medium" : ""}`}
                      >
                        {item.label}
                      </Label>
                    </div>
                    {item.link && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
