import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { storage } from "./storage";
import { insertVideoProjectSchema } from "@shared/schema";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { registerHiggsFieldRoutes } from "./replit_integrations/higgs";

// Initialize OpenAI client
const openaiApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const openaiBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

const openai = openaiApiKey ? new OpenAI({
  apiKey: openaiApiKey,
  baseURL: openaiBaseUrl,
}) : null;

// Helper function to check if OpenAI is available
const isOpenAIAvailable = () => {
  const available = !!openaiApiKey && !!openai;
  if (!available) {
    console.log("[OpenAI] Not available - API Key:", openaiApiKey ? "Set" : "Missing", "Base URL:", openaiBaseUrl || "Default");
  } else {
    console.log("[OpenAI] Available and ready to use");
  }
  return available;
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const parsed = insertVideoProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const project = await storage.createProject(parsed.data);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.updateProject(id, req.body);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProject(id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.post("/api/generate-script", async (req, res) => {
    try {
      const { purpose, tone, keyPhrase, keyword, videoLength } = req.body;

      // Use OpenAI if available, otherwise fall back to dummy data
      if (isOpenAIAvailable()) {
        console.log("Generating script with OpenAI...");

      const systemPrompt = `You are an expert short-form video scriptwriter. Create compelling, concise scripts for social media videos.

Your scripts should:
- Be ${videoLength || 15}-${(videoLength || 15) + 5} seconds when spoken aloud (roughly ${Math.round((videoLength || 15) * 2.5)} words)
- Match the ${tone || "professional"} tone
- Serve the ${purpose || "educational"} purpose
- Be emotionally engaging and authentic
- Include a clear call-to-action or takeaway

You must respond with valid JSON containing these exact fields:
{
  "title": "A catchy project title (5-8 words)",
  "script": "The video script (2-3 sentences)",
  "imagePrompt": "A detailed prompt for AI image generation describing the scene/character",
  "videoPrompt": "A detailed prompt for AI video generation describing camera movement and actions"
}`;

      const userPrompt = `Create a video script with these requirements:
- Purpose: ${purpose || "educational"}
- Tone: ${tone || "professional"}
- Target duration: ${videoLength || 15} seconds
${keyPhrase ? `- Must include this key phrase: "${keyPhrase}"` : ""}
${keyword ? `- Must emphasize this keyword: "${keyword}"` : ""}

Generate an authentic, relatable script that would work well for short-form video content. Return ONLY the JSON object.`;

        const response = await openai!.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response content from AI");
      }

      const result = JSON.parse(content);
        console.log("OpenAI script generated:", result);
        return res.json(result);
      } else {
        // Fallback to dummy data
        console.log("OpenAI not configured, using dummy data for script generation");
        
        const dummyScript = keyPhrase && keyword
          ? `I work hard just to stay afloat, and ${purpose === "educational" ? "learning" : "managing"} felt overwhelming. ${keyword === "Protection" ? "Stay protected" : "Stay organized"} when it matters most${keyPhrase ? `, ${keyPhrase}` : ""}.`
          : `This is a ${tone || "professional"} ${purpose || "educational"} video script. ${keyPhrase || ""} ${keyword ? `Focus on ${keyword}.` : ""}`;

        const dummyTitle = `${purpose || "Educational"} ${tone || "Professional"} Video`;
        
        const dummyImagePrompt = `A ${tone || "professional"} scene showing ${purpose === "educational" ? "someone learning or teaching" : purpose === "testimonial" ? "a person sharing their experience" : "a promotional scene"}, ${keyword ? `emphasizing ${keyword}` : ""}, ${keyPhrase ? `with the concept of ${keyPhrase}` : ""}, high quality, detailed, cinematic lighting`;
        
        const dummyVideoPrompt = `Smooth camera movement, ${tone === "energetic" ? "dynamic and fast-paced" : tone === "emotional" ? "slow and emotional" : "professional and steady"}, ${purpose === "educational" ? "educational content style" : "engaging visual style"}`;

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const result = {
          title: dummyTitle,
          script: dummyScript.trim(),
          imagePrompt: dummyImagePrompt,
          videoPrompt: dummyVideoPrompt,
        };

        console.log("Dummy script generated:", result);
        return res.json(result);
      }
    } catch (error: any) {
      console.error("Error generating script:", error);
      const errorMessage = error?.message || "Failed to generate script";
      const statusCode = error?.status || 500;
      
      // Log more details for debugging
      if (error?.response) {
        console.error("OpenAI API Error:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }
      
      res.status(statusCode).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      });
    }
  });

  // Register Higgs Field API routes
  registerHiggsFieldRoutes(app);

  // Enhance prompt with AI
  app.post("/api/enhance-prompt", async (req, res) => {
    try {
      const { prompt, type = "image" } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Use OpenAI if available, otherwise fall back to dummy data
      if (isOpenAIAvailable()) {
        console.log("Enhancing prompt with OpenAI...");
        
        const systemPrompt = type === "image"
          ? `You are an expert at creating detailed, vivid image generation prompts. Enhance the given prompt to be more descriptive, specific, and optimized for AI image generation. Include details about lighting, composition, style, mood, and visual elements.`
          : `You are an expert at creating detailed video generation prompts. Enhance the given prompt to include specific camera movements, scene composition, visual style, and dynamic elements.`;

        const userPrompt = `Enhance this ${type} generation prompt to be more detailed and effective:\n\n"${prompt}"\n\nReturn ONLY the enhanced prompt, no explanations or additional text.`;

        const response = await openai!.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
        });

        const enhancedPrompt = response.choices[0]?.message?.content?.trim();
        if (!enhancedPrompt) {
          throw new Error("No enhanced prompt received");
        }

        console.log("OpenAI enhanced prompt:", enhancedPrompt);
        return res.json({ enhancedPrompt });
      } else {
        // Fallback to dummy data
        console.log("OpenAI not configured, using dummy data for prompt enhancement");
        
        const enhancements = type === "image"
          ? "high quality, detailed, cinematic lighting, professional photography, 4k resolution, vibrant colors, sharp focus"
          : "smooth camera movement, professional cinematography, dynamic angles, engaging visual flow, cinematic quality";
        
        const enhancedPrompt = `${prompt}, ${enhancements}`;

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        console.log("Dummy enhanced prompt:", enhancedPrompt);
        return res.json({ enhancedPrompt });
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      res.status(500).json({ error: "Failed to enhance prompt" });
    }
  });

  // Configure multer for file uploads
  const uploadsDir = path.resolve(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storageConfig = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `hook-${uniqueSuffix}${ext}`);
    },
  });

  const upload = multer({
    storage: storageConfig,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept audio and video files
      const allowedMimes = [
        "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm",
        "video/mp4", "video/webm", "video/ogg", "video/quicktime"
      ];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type. Only audio and video files are allowed."));
      }
    },
  });

  // Upload hook file for a project
  app.post("/api/projects/:id/upload-hook", upload.single("hookFile"), async (req, res) => {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ error: "Hook file is required" });
      }

      // Create a URL to access the file (in production, you'd use a CDN or proper file serving)
      const fileUrl = `/uploads/${req.file.filename}`;

      const project = await storage.updateProject(id, {
        hookUrl: fileUrl,
        hook: req.file.originalname,
        hookGenerated: true,
      });

      if (!project) {
        // Clean up uploaded file if project not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: "Project not found" });
      }

      res.json(project);
    } catch (error: any) {
      console.error("Error uploading hook:", error);
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ 
        error: "Failed to upload hook",
        message: error.message 
      });
    }
  });

  return httpServer;
}
