import type { Express, Request, Response } from "express";
import {
  generateImage,
  generateVideo,
  generateVoice,
  getVideoStatus,
  listVoices,
} from "./client";

export function registerHiggsFieldRoutes(app: Express): void {
  /**
   * Generate an image using Higgs Field
   * POST /api/higgs/generate-image
   * Body: { prompt: string, size?: string, style?: string }
   */
  app.post("/api/higgs/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt, size, style } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const result = await generateImage(prompt, { size, style });
      res.json(result);
    } catch (error: any) {
      console.error("Error generating image with Higgs Field:", error);
      res.status(500).json({
        error: "Failed to generate image",
        message: error.message,
      });
    }
  });

  /**
   * Generate a video using Higgs Field Lipsync Studio
   * POST /api/higgs/generate-video
   * Body: { imageUrl: string, script: string, voiceId?: string, duration?: number }
   */
  app.post("/api/higgs/generate-video", async (req: Request, res: Response) => {
    try {
      const { imageUrl, script, voiceId, duration, style } = req.body;

      if (!imageUrl || !script) {
        return res.status(400).json({
          error: "imageUrl and script are required",
        });
      }

      const result = await generateVideo(imageUrl, script, voiceId, {
        duration,
        style,
      });
      res.json(result);
    } catch (error: any) {
      console.error("Error generating video with Higgs Field:", error);
      res.status(500).json({
        error: "Failed to generate video",
        message: error.message,
      });
    }
  });

  /**
   * Generate voice/audio using Higgs Field
   * POST /api/higgs/generate-voice
   * Body: { text: string, voiceId?: string, speed?: number, pitch?: number }
   */
  app.post("/api/higgs/generate-voice", async (req: Request, res: Response) => {
    try {
      const { text, voiceId, speed, pitch, style } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const result = await generateVoice(text, voiceId, { speed, pitch, style });
      res.json(result);
    } catch (error: any) {
      console.error("Error generating voice with Higgs Field:", error);
      res.status(500).json({
        error: "Failed to generate voice",
        message: error.message,
      });
    }
  });

  /**
   * Check video generation status
   * GET /api/higgs/video-status/:videoId
   */
  app.get("/api/higgs/video-status/:videoId", async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params;
      const status = await getVideoStatus(videoId);
      res.json(status);
    } catch (error: any) {
      console.error("Error checking video status:", error);
      res.status(500).json({
        error: "Failed to check video status",
        message: error.message,
      });
    }
  });

  /**
   * List available voices
   * GET /api/higgs/voices
   */
  app.get("/api/higgs/voices", async (req: Request, res: Response) => {
    try {
      const voices = await listVoices();
      res.json({ voices });
    } catch (error: any) {
      console.error("Error listing voices:", error);
      res.status(500).json({
        error: "Failed to list voices",
        message: error.message,
      });
    }
  });
}
