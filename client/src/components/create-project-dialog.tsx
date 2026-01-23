import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  platform: z.enum(["reels", "tiktok", "shorts"]),
  videoLength: z.number().min(5).max(60),
  purpose: z.enum(["educational", "explainer", "testimonial", "promotional"]),
  tone: z.enum(["professional", "casual", "energetic", "emotional"]),
  keyPhrase: z.string().optional(),
  keyword: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateProjectDialogProps {
  onProjectCreated?: () => void;
}

export function CreateProjectDialog({ onProjectCreated }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      platform: "reels",
      videoLength: 15,
      purpose: "educational",
      tone: "professional",
      keyPhrase: "",
      keyword: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await apiRequest("POST", "/api/projects", values);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project created",
        description: "Your video project has been created successfully.",
      });
      setOpen(false);
      form.reset();
      onProjectCreated?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateScriptMutation = useMutation({
    mutationFn: async (values: Partial<FormValues>) => {
      const response = await apiRequest("POST", "/api/generate-script", values);
      return response;
    },
    onSuccess: (data: { script: string; imagePrompt: string; videoPrompt: string }) => {
      toast({
        title: "Script generated",
        description: "AI has generated a script for your video.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    createMutation.mutate(values);
  };

  const handleGenerateScript = async () => {
    const values = form.getValues();
    if (!values.purpose || !values.tone) {
      toast({
        title: "Missing information",
        description: "Please select purpose and tone before generating a script.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/generate-script", {
        purpose: values.purpose,
        tone: values.tone,
        keyPhrase: values.keyPhrase,
        keyword: values.keyword,
        videoLength: values.videoLength,
      });
      
      const data = await response.json();
      
      if (data.script) {
        form.setValue("title", data.title || values.title);
      }
      
      toast({
        title: "Script generated",
        description: "AI has generated a script. Create the project to save it.",
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-project">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Video Project</DialogTitle>
          <DialogDescription>
            Define your video goals and let AI help generate the script.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Medicaid Testimonial Video" 
                      {...field}
                      data-testid="input-project-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-platform">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="reels">Instagram Reels</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="shorts">YouTube Shorts</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration: {field.value}s</FormLabel>
                    <FormControl>
                      <Slider
                        min={5}
                        max={60}
                        step={5}
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                        data-testid="slider-video-length"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-purpose">
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="explainer">Explainer</SelectItem>
                        <SelectItem value="testimonial">Testimonial</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tone">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="energetic">Energetic</SelectItem>
                        <SelectItem value="emotional">Emotional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="keyPhrase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Phrase (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., For less than a dollar a day" 
                      {...field}
                      data-testid="input-key-phrase"
                    />
                  </FormControl>
                  <FormDescription>
                    A phrase to include in the script
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keyword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keyword (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Protection" 
                      {...field}
                      data-testid="input-keyword"
                    />
                  </FormControl>
                  <FormDescription>
                    A keyword to emphasize in the content
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleGenerateScript}
                disabled={isGenerating}
                className="flex-1"
                data-testid="button-generate-script"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate with AI
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="flex-1"
                data-testid="button-submit-project"
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
