import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVideoProjectSchema } from "@shared/schema";
import OpenAI from "openai";
import { registerHiggsFieldRoutes } from "./replit_integrations/higgs";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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

      console.log("Generating script with OpenAI...");
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      });

      console.log("OpenAI response received:", JSON.stringify(response.choices[0]?.message));

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error("No content in OpenAI response:", response);
        throw new Error("No response content from AI");
      }

      const result = JSON.parse(content);
      console.log("Parsed result:", result);
      res.json(result);
    } catch (error) {
      console.error("Error generating script:", error);
      res.status(500).json({ error: "Failed to generate script" });
    }
  });

  // Register Higgs Field API routes
  registerHiggsFieldRoutes(app);

  return httpServer;
}
