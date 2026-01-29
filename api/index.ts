// Vercel serverless function entry point
// This wraps the Express app for Vercel deployment

// Set VERCEL env var so server knows it's running on Vercel
process.env.VERCEL = "1";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

console.log("[Vercel] Initializing API handler...");

// Import dependencies directly (Vercel will bundle these)
import express from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertVideoProjectSchema } from "../shared/schema";
import OpenAI from "openai";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Higgsfield routes from local file
import { registerHiggsFieldRoutes } from "./higgs-routes";

// Create Express app
const app = express();
const httpServer = createServer(app);

// Configure middleware
app.use(
  express.json({
    limit: "50mb",
  })
);
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Initialize the app once and cache it
let appInitialized = false;
let initPromise: Promise<void> | null = null;
let initError: Error | null = null;

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

async function registerRoutes() {
  // Projects routes
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

  // Generate script route
  app.post("/api/generate-script", async (req, res) => {
    try {
      const { purpose, tone, keyPhrase, keyword, videoLength } = req.body;

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

  // Enhance prompt route
  app.post("/api/enhance-prompt", async (req, res) => {
    try {
      const { prompt, type = "image" } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

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
        console.log("OpenAI not configured, using dummy data for prompt enhancement");
        
        const enhancements = type === "image"
          ? "high quality, detailed, cinematic lighting, professional photography, 4k resolution, vibrant colors, sharp focus"
          : "smooth camera movement, professional cinematography, dynamic angles, engaging visual flow, cinematic quality";
        
        const enhancedPrompt = `${prompt}, ${enhancements}`;

        await new Promise(resolve => setTimeout(resolve, 800));

        console.log("Dummy enhanced prompt:", enhancedPrompt);
        return res.json({ enhancedPrompt });
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      res.status(500).json({ error: "Failed to enhance prompt" });
    }
  });

  // Register Higgsfield routes (if available)
  try {
    await registerHiggsFieldRoutes(app);
  } catch (err) {
    console.warn("[Vercel] Could not register Higgsfield routes:", err);
  }

  // File upload route (disabled on Vercel - files won't persist)
  // Note: File uploads won't work on Vercel serverless - need external storage
}

async function initializeApp() {
  // If we have a cached error, throw it immediately
  if (initError) {
    throw initError;
  }

  if (appInitialized) {
    return;
  }

  if (!initPromise) {
    console.log("[Vercel] Starting app initialization...");
    initPromise = (async () => {
      try {
        // Register all routes
        await registerRoutes();

        // Error handler
        app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
          const status = err.status || err.statusCode || 500;
          const message = err.message || "Internal Server Error";
          console.error("Internal Server Error:", err);
          if (res.headersSent) {
            return next(err);
          }
          return res.status(status).json({ message });
        });

        appInitialized = true;
        console.log("[Vercel] App initialized successfully");
      } catch (err: any) {
        console.error("[Vercel] Failed to initialize app:", err);
        initError = err;
        initPromise = null;
        throw err;
      }
    })();
  }
  
  await initPromise;
}

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  console.log(`[Vercel] Handling ${req.method} ${req.url}`);
  
  try {
    // Ensure app is initialized
    await initializeApp();
    
    // Wrap Express handler in a promise to handle it properly
    return new Promise((resolve, reject) => {
      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          console.error("[Vercel] Request timeout");
          res.status(504).json({ error: "Request timeout" });
        }
        resolve(undefined);
      }, 25000); // 25 second timeout (Vercel max is 30s on free tier)

      // Handle response completion
      res.on('finish', () => {
        clearTimeout(timeout);
        console.log(`[Vercel] Request completed: ${req.method} ${req.url} - ${res.statusCode}`);
        resolve(undefined);
      });

      res.on('close', () => {
        clearTimeout(timeout);
        resolve(undefined);
      });

      // Call the Express app handler
      try {
        app(req, res, (err: any) => {
          clearTimeout(timeout);
          if (err) {
            console.error("[Vercel] Express error:", err);
            reject(err);
          } else {
            resolve(undefined);
          }
        });
      } catch (err) {
        clearTimeout(timeout);
        console.error("[Vercel] Error calling app handler:", err);
        reject(err);
      }
    });
  } catch (error: any) {
    console.error("[Vercel] Handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Internal server error", 
        message: error?.message || "Unknown error"
      });
    }
  }
}
