// Higgsfield routes for Vercel - copied from server/replit_integrations/higgs/routes.ts
import type { Express, Request, Response } from "express";

export async function registerHiggsFieldRoutes(app: Express): Promise<void> {
  // Dynamic import for Higgsfield client functions
  let generateImage: any;
  let generateVideo: any;
  
  try {
    const higgsClient = await import("../server/replit_integrations/higgs/client");
    generateImage = higgsClient.generateImage;
    generateVideo = higgsClient.generateVideo;
  } catch (err) {
    console.warn("[Vercel] Could not import Higgsfield client:", err);
    // Fallback: provide stub functions
    generateImage = async () => {
      throw new Error("Higgsfield client not available");
    };
    generateVideo = async () => {
      throw new Error("Higgsfield client not available");
    };
  }
  app.post("/api/higgs/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt, aspectRatio, resolution, batchSize, enhancePrompt, styleStrength } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const result = await generateImage(prompt, {
        aspectRatio: aspectRatio || "4:3",
        resolution: resolution || "720p",
        batchSize: batchSize || 1,
        enhancePrompt: enhancePrompt !== undefined ? enhancePrompt : true,
        styleStrength: styleStrength !== undefined ? styleStrength : 1,
      });
      res.json(result);
    } catch (error: any) {
      console.error("Error generating image with Higgsfield:", error);
      res.status(500).json({
        error: "Failed to generate image",
        message: error.message,
      });
    }
  });

  app.post("/api/higgs/generate-video", async (req: Request, res: Response) => {
    try {
      const { imageUrl, prompt, model } = req.body;

      if (!imageUrl) {
        return res.status(400).json({
          error: "imageUrl is required",
        });
      }

      const result = await generateVideo(imageUrl, prompt || "Cinematic camera movement", {
        model: model || "dop-turbo",
      });
      res.json(result);
    } catch (error: any) {
      console.error("Error generating video with Higgsfield:", error);
      res.status(500).json({
        error: "Failed to generate video",
        message: error.message,
      });
    }
  });
}
