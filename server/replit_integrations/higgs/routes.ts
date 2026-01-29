import type { Express, Request, Response } from "express";
import {
  generateImage,
  generateVideo,
  generateSpeechToVideo,
  generateVoice,
  getVideoStatus,
  listVoices,
} from "./client";

export function registerHiggsFieldRoutes(app: Express): void {
  /**
   * Generate an image using Higgs Field Soul standard model
   * POST /api/higgs/generate-image
   * Body: { 
   *   prompt: string, 
   *   aspectRatio?: "9:16" | "16:9" | "1:1" | "4:3" | "3:4",
   *   resolution?: "720p" | "1080p" | "4k",
   *   batchSize?: number,
   *   enhancePrompt?: boolean,
   *   styleStrength?: number
   * }
   */
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

  /**
   * Generate a video using Higgsfield image-to-video
   * POST /api/higgs/generate-video
   * Body: { imageUrl: string, prompt?: string, model?: string }
   */
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

  /**
   * Generate speech-to-video (lipsync) using Higgsfield Speak
   * POST /api/higgs/generate-speech-video
   * Body: { imageUrl: string, audioUrl: string, prompt?: string, quality?: string, duration?: string }
   */
  app.post("/api/higgs/generate-speech-video", async (req: Request, res: Response) => {
    try {
      const { imageUrl, audioUrl, prompt, quality, duration } = req.body;

      if (!imageUrl || !audioUrl) {
        return res.status(400).json({
          error: "imageUrl and audioUrl are required",
        });
      }

      const result = await generateSpeechToVideo(imageUrl, audioUrl, prompt, {
        quality: quality || "mid",
        duration: duration || "short",
      });
      res.json(result);
    } catch (error: any) {
      console.error("Error generating speech-to-video with Higgsfield:", error);
      res.status(500).json({
        error: "Failed to generate speech-to-video",
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
      const videoId = Array.isArray(req.params.videoId) ? req.params.videoId[0] : req.params.videoId;
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
