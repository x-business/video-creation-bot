import { useState, useEffect } from "react";
import { 
  Image, 
  Wand2, Loader2, Check, 
  ArrowRight, ArrowLeft, Download,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Select component disabled (video step removed)
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { VideoProject } from "@shared/schema";

interface InteractiveWorkflowProps {
  project: VideoProject;
  onUpdate: (updates: Partial<VideoProject>) => void;
}

type WorkflowStep = "script" | "image"; // Video disabled for now

export function InteractiveWorkflow({ project, onUpdate }: InteractiveWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("script");
  const [imagePrompt, setImagePrompt] = useState(project.enhancedImagePrompt || project.imagePrompt || "");
  // Voice selection disabled (video step removed)
  // const [selectedVoiceId, setSelectedVoiceId] = useState(project.selectedVoiceId || "default");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine current step based on project state
  useEffect(() => {
    // Auto-mark hook as generated since we're skipping that step
    if (!project.hookGenerated) {
      onUpdate({ hookGenerated: true });
    }
    
    // Only auto-navigate to script step if no script AND no image prompt exists
    // This allows users to skip script generation if they have their own prompts
    if (!project.script && !project.imagePrompt && !project.imageGenerated) {
      setCurrentStep("script");
    } else if (!project.imageGenerated) {
      setCurrentStep("image");
    }
    // Video step disabled for now - only show image generation
    // else if (!project.videoGenerated || !project.audioGenerated) {
    //   setCurrentStep("video");
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  // Fetch available voices (disabled for now - video step removed)
  // const { data: voicesData } = useQuery<{ voices: Array<{ id: string; name: string; gender?: string; language?: string }> }>({
  //   queryKey: ["/api/higgs/voices"],
  //   enabled: currentStep === "video",
  // });

  // const voices = voicesData?.voices || [];

  // Script generation mutation
  const generateScriptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate-script", {
        purpose: project.purpose,
        tone: project.tone,
        keyPhrase: project.keyPhrase,
        keyword: project.keyword,
        videoLength: project.videoLength,
      });
      return response.json();
    },
    onSuccess: async (data) => {
      const response = await apiRequest("PATCH", `/api/projects/${project.id}`, {
        script: data.script,
        imagePrompt: data.imagePrompt,
        videoPrompt: data.videoPrompt,
      });
      const updated = await response.json();
      onUpdate(updated);
      setImagePrompt(data.imagePrompt);
      setCurrentStep("image");
      toast({
        title: "Script generated!",
        description: "Your script is ready. You can now generate the image.",
      });
    },
  });

  // Prompt enhancement mutation
  const enhancePromptMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/enhance-prompt", {
        prompt,
        type: "image",
      });
      return response.json();
    },
    onSuccess: (data) => {
      setImagePrompt(data.enhancedPrompt);
      toast({
        title: "Prompt enhanced!",
        description: "Your prompt has been improved with AI.",
      });
    },
  });

  // Image generation mutation
  const generateImageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/higgs/generate-image", {
        prompt,
        aspectRatio: "9:16", // Vertical format for social media
      });
      return response.json();
    },
    onSuccess: async (data) => {
      console.log("[Frontend] Image generation response:", data);
      const imageUrl = data.url || data.image_url || (data.data ? `data:image/png;base64,${data.data}` : null);
      
      if (!imageUrl) {
        console.error("[Frontend] No image URL in response:", data);
        toast({
          title: "Error",
          description: "Image generated but no URL received. Check console for details.",
          variant: "destructive",
        });
        return;
      }

      console.log("[Frontend] Saving image URL:", imageUrl);
      try {
        const response = await apiRequest("PATCH", `/api/projects/${project.id}`, {
          imageUrl,
          enhancedImagePrompt: imagePrompt,
          imageGenerated: true,
        });
        const updated = await response.json();
        console.log("[Frontend] Project updated:", updated);
        onUpdate(updated);
        
        // Refresh the query to ensure UI updates
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}`] });
        
        toast({
          title: "Image generated!",
          description: "Your image is ready!",
        });
      } catch (error: any) {
        console.error("[Frontend] Error saving image:", error);
        toast({
          title: "Error",
          description: "Failed to save image URL: " + (error.message || "Unknown error"),
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("[Frontend] Image generation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    },
  });

  // Video generation mutation (disabled for now)
  // const generateVideoMutation = useMutation({
  //   mutationFn: async () => {
  //     if (!project.imageUrl) {
  //       throw new Error("Image is required");
  //     }
  //     const videoResponse = await apiRequest("POST", "/api/higgs/generate-video", {
  //       imageUrl: project.imageUrl,
  //       prompt: project.videoPrompt || "Cinematic camera movement, professional style",
  //       model: "dop-turbo",
  //     });
  //     const videoData = await videoResponse.json();
  //     return { video: videoData };
  //   },
  //   onSuccess: async (data) => {
  //     const updates: Partial<VideoProject> = {
  //       videoGenerated: true,
  //       selectedVoiceId: selectedVoiceId && selectedVoiceId !== "default" ? selectedVoiceId : null,
  //     };
  //     if (data.video.url) {
  //       updates.videoUrl = data.video.url;
  //     }
  //     const response = await apiRequest("PATCH", `/api/projects/${project.id}`, updates);
  //     const updated = await response.json();
  //     onUpdate(updated);
  //     toast({
  //       title: "Video generated!",
  //       description: "Your video is ready.",
  //     });
  //   },
  // });

  const handleEnhancePrompt = () => {
    if (!imagePrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter an image prompt.",
        variant: "destructive",
      });
      return;
    }
    enhancePromptMutation.mutate(imagePrompt);
  };

  const handleGenerateImage = () => {
    if (!imagePrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter an image prompt.",
        variant: "destructive",
      });
      return;
    }
    generateImageMutation.mutate(imagePrompt);
  };

  // Video generation handler (disabled for now)
  // const handleGenerateVideo = () => {
  //   if (!project.imageUrl) {
  //     toast({
  //       title: "Error",
  //       description: "Please generate an image first.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }
  //   if (!project.script) {
  //     toast({
  //       title: "Error",
  //       description: "Please generate a script first.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }
  //   generateVideoMutation.mutate();
  // };

  const canProceedToNext = () => {
    switch (currentStep) {
      case "script":
        // Allow proceeding even without script - script generation is optional
        return true;
      case "image":
        return project.imageGenerated;
      // Video step disabled
      // case "video":
      //   return project.videoGenerated && project.audioGenerated;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "script":
        return (
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                <CardTitle>Step 1: Generate Script</CardTitle>
              </div>
              <CardDescription>
                Generate your script using ChatGPT with your key phrase and keyword.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(project.keyPhrase || project.keyword) && (
                <div className="flex flex-wrap gap-2">
                  {project.keyPhrase && (
                    <Badge variant="outline">Key phrase: "{project.keyPhrase}"</Badge>
                  )}
                  {project.keyword && (
                    <Badge variant="outline">Keyword: {project.keyword}</Badge>
                  )}
                </div>
              )}
              {project.script ? (
                <div className="space-y-2">
                  <Label>Generated Script</Label>
                  <div className="bg-muted rounded-md p-4 text-sm whitespace-pre-wrap">
                    {project.script}
                  </div>
                  <Button
                    onClick={() => setCurrentStep("image")}
                    className="w-full"
                  >
                    Continue to Image Generation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={() => generateScriptMutation.mutate()}
                    disabled={generateScriptMutation.isPending}
                    className="w-full"
                  >
                    {generateScriptMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate Script with AI
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setCurrentStep("image")}
                    variant="outline"
                    className="w-full"
                  >
                    Skip Script Generation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    You can skip this step if you already have a script or want to generate images directly.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "image":
        return (
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                <CardTitle>Step 2: Generate Image</CardTitle>
              </div>
              <CardDescription>
                Create an image using Higgs Field. Enhance your prompt with AI for better results.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="image-prompt">Image Prompt</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnhancePrompt}
                    disabled={enhancePromptMutation.isPending || !imagePrompt.trim()}
                  >
                    {enhancePromptMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Enhance with AI
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="image-prompt"
                  placeholder="Enter image generation prompt..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={4}
                />
                {project.imagePrompt && !imagePrompt && (
                  <p className="text-xs text-muted-foreground">
                    Original prompt: {project.imagePrompt}
                  </p>
                )}
              </div>
              <Button
                onClick={handleGenerateImage}
                disabled={generateImageMutation.isPending || !imagePrompt.trim()}
                className="w-full"
              >
                {generateImageMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Image className="mr-2 h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
              {project.imageUrl ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <Label className="text-lg font-semibold">Generated Image</Label>
                  </div>
                  <div className="relative group flex justify-center">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                    <div className="relative rounded-lg overflow-hidden border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-background to-muted/50 p-2 max-w-md">
                      <img
                        src={project.imageUrl}
                        alt="Generated"
                        className="w-full h-auto max-h-[500px] object-contain rounded-md shadow-lg transition-transform duration-300 hover:scale-[1.02]"
                        onLoad={(e) => {
                          // Add fade-in animation when image loads
                          const imgElement = e.currentTarget;
                          if (!imgElement) return;
                          
                          imgElement.style.opacity = '0';
                          setTimeout(() => {
                            // Check if element still exists before accessing style
                            if (imgElement && imgElement.parentElement) {
                              imgElement.style.transition = 'opacity 0.5s ease-in';
                              imgElement.style.opacity = '1';
                            }
                          }, 10);
                        }}
                        onError={(e) => {
                          console.error("[Frontend] Image load error:", project.imageUrl);
                          toast({
                            title: "Image Load Error",
                            description: "Failed to load image. The URL may be invalid or expired.",
                            variant: "destructive",
                          });
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      asChild
                    >
                      <a href={project.imageUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download Image
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        navigator.clipboard.writeText(project.imageUrl || '');
                        toast({
                          title: "Copied!",
                          description: "Image URL copied to clipboard",
                        });
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Copy URL
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        if (project.imageUrl) {
                          window.open(project.imageUrl, '_blank');
                        }
                      }}
                    >
                      <Image className="mr-2 h-4 w-4" />
                      View Full
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground break-all">
                    URL: {project.imageUrl}
                  </div>
                </div>
              ) : project.imageGenerated ? (
                <div className="space-y-2 p-4 border border-yellow-500/50 rounded-md bg-yellow-500/10">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <Label>Image generated but URL not found</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The image was generated but the URL is missing. Please check the console for details.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );

      // Video step disabled
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Step Navigation */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const steps: WorkflowStep[] = ["script", "image"];
            const currentIndex = steps.indexOf(currentStep);
            if (currentIndex > 0) {
              setCurrentStep(steps[currentIndex - 1]);
            }
          }}
          disabled={currentStep === "script"}
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
      </div>
      <Badge variant="outline">
        Step {["script", "image"].indexOf(currentStep) + 1} of 2
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const steps: WorkflowStep[] = ["script", "image"];
          const currentIndex = steps.indexOf(currentStep);
          if (currentIndex < steps.length - 1 && canProceedToNext()) {
            setCurrentStep(steps[currentIndex + 1]);
          }
        }}
        disabled={currentStep === "image" || !canProceedToNext()}
      >
        Next
        <ArrowRight className="h-4 w-4" />
      </Button>
      </div>

      {/* Current Step Content */}
      {renderStep()}
    </div>
  );
}
