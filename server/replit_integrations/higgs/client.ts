/**
 * Higgsfield SDK Client
 * 
 * Uses the official @higgsfield/client SDK for:
 * - Image generation (text-to-image)
 * - Video generation (image-to-video)
 * - Speech-to-video (lipsync)
 */

import { higgsfield, config } from '@higgsfield/client/v2';
import type { V2Response } from '@higgsfield/client/v2';

// Get credentials from environment variables
const credentials = process.env.HF_CREDENTIALS || 
  (process.env.HF_API_KEY && process.env.HF_API_SECRET 
    ? `${process.env.HF_API_KEY}:${process.env.HF_API_SECRET}`
    : null);

// Configure the SDK if credentials are available
if (credentials) {
  // Check if credentials are in the correct format (key:secret)
  const [key, secret] = credentials.split(':');
  if (!key || !secret) {
    console.error("[Higgsfield] Error: Credentials must be in format 'KEY_ID:KEY_SECRET'");
    console.error("[Higgsfield] Current format:", credentials ? "Found but invalid" : "Not found");
  } else {
    config({ credentials });
    console.log("[Higgsfield] SDK configured with credentials");
    console.log("[Higgsfield] Key ID (first 8 chars):", key.substring(0, 8) + "...");
    console.log("[Higgsfield] Secret (first 8 chars):", secret.substring(0, 8) + "...");
  }
} else {
  console.warn("[Higgsfield] Warning: HF_CREDENTIALS or HF_API_KEY/HF_API_SECRET not set.");
  console.warn("[Higgsfield] Checked environment variables:");
  console.warn("[Higgsfield]   HF_CREDENTIALS:", process.env.HF_CREDENTIALS ? "SET (hidden)" : "NOT SET");
  console.warn("[Higgsfield]   HF_API_KEY:", process.env.HF_API_KEY ? "SET (hidden)" : "NOT SET");
  console.warn("[Higgsfield]   HF_API_SECRET:", process.env.HF_API_SECRET ? "SET (hidden)" : "NOT SET");
}

/**
 * Generate an image using Higgsfield Soul standard model
 * Uses direct HTTP requests with the correct header format
 * @param prompt - Text description of the image to generate
 * @param options - Additional options (aspect ratio, resolution, etc.)
 */
export async function generateImage(
  prompt: string,
  options: {
    aspectRatio?: "9:16" | "16:9" | "1:1" | "4:3" | "3:4";
    resolution?: "720p" | "1080p" | "4k";
    batchSize?: number;
    enhancePrompt?: boolean;
    styleStrength?: number;
  } = {}
): Promise<{ url?: string; data?: string; buffer?: Buffer }> {
  const apiKey = process.env.HF_API_KEY || (credentials ? credentials.split(':')[0] : null);
  const apiSecret = process.env.HF_API_SECRET || (credentials ? credentials.split(':')[1] : null);

  if (!apiKey || !apiSecret) {
    throw new Error("Higgsfield credentials not configured. Set HF_API_KEY and HF_API_SECRET environment variables.");
  }

  try {
    console.log("[Higgsfield] Generating image with direct API call");
    console.log("[Higgsfield] Endpoint: https://platform.higgsfield.ai/higgsfield-ai/soul/standard");
    console.log("[Higgsfield] Prompt:", prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""));

    // Make initial request to start generation
    const requestBody = {
      prompt: prompt,
      batch_size: options.batchSize || 1,
      resolution: options.resolution || "720p",
      aspect_ratio: options.aspectRatio || "9:16",
      enhance_prompt: options.enhancePrompt !== undefined ? options.enhancePrompt : true,
      style_strength: options.styleStrength !== undefined ? options.styleStrength : 1,
    };

    // Retry logic for network issues
    let lastError: Error | null = null;
    const maxRetries = 3;
    const timeoutMs = 30000; // 30 seconds timeout
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let timeoutId: NodeJS.Timeout | null = null;
      try {
        console.log(`[Higgsfield] Attempt ${attempt + 1}/${maxRetries} to generate image`);
        
        // Create AbortController for timeout
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const response = await fetch('https://platform.higgsfield.ai/higgsfield-ai/soul/standard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'hf-api-key': apiKey,
            'hf-secret': apiSecret,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        
        if (timeoutId) clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[Higgsfield] API error response:", errorText);
          let errorMessage = `API request failed with status ${response.status}`;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log("[Higgsfield] API response:", JSON.stringify(result, null, 2));

        // Handle different response formats
        // Format 1: Direct image URLs in response
        if (result.images && Array.isArray(result.images) && result.images.length > 0) {
          const imageUrl = typeof result.images[0] === 'string' 
            ? result.images[0] 
            : result.images[0].url || result.images[0].image_url;
          if (imageUrl) {
            return { url: imageUrl };
          }
        }

        // Format 2: Single image URL
        if (result.url || result.image_url) {
          return { url: result.url || result.image_url };
        }

        // Format 3: Request ID for polling
        if (result.request_id || result.id) {
          const requestId = result.request_id || result.id;
          if (requestId && typeof requestId === 'string') {
            console.log("[Higgsfield] Polling for status with request_id:", requestId);
            return await pollForImageStatus(requestId, apiKey, apiSecret);
          }
        }

        // Format 4: Check if result itself is an array of URLs
        if (Array.isArray(result) && result.length > 0) {
          return { url: typeof result[0] === 'string' ? result[0] : result[0].url };
        }

        console.error("[Higgsfield] Unexpected response format:", result);
        throw new Error(`Unexpected response format from API: ${JSON.stringify(result)}`);
      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);
        lastError = error;
        
        // Check if it's a timeout or connection error
        const isNetworkError = error.name === 'AbortError' || 
                              error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                              error.message?.includes('timeout') ||
                              error.message?.includes('fetch failed') ||
                              error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT';
        
        if (isNetworkError && attempt < maxRetries - 1) {
          const waitTime = (attempt + 1) * 2000; // Exponential backoff: 2s, 4s, 6s
          console.warn(`[Higgsfield] Network error on attempt ${attempt + 1}, retrying in ${waitTime}ms...`);
          console.warn(`[Higgsfield] Error details:`, error.message || error);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // If it's the last attempt or not a network error, throw
        throw error;
      }
    }
    
    // Should never reach here, but just in case
    throw lastError || new Error("Failed to generate image after retries");
  } catch (error: any) {
    console.error("[Higgsfield] Error generating image:", error);
    if (error.message && error.message.toLowerCase().includes("credit")) {
      console.error("[Higgsfield] Credit error detected. Please verify:");
      console.error("  1. Your API key and secret are correct");
      console.error("  2. Your account has sufficient credits");
      console.error("  3. Environment variables are set correctly (HF_API_KEY and HF_API_SECRET)");
    }
    throw error;
  }
}

/**
 * Poll for image generation status
 */
async function pollForImageStatus(
  requestId: string,
  apiKey: string,
  apiSecret: string,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<{ url?: string; data?: string; buffer?: Buffer }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const statusResponse = await fetch(`https://platform.higgsfield.ai/requests/${requestId}/status`, {
        method: 'GET',
        headers: {
          'hf-api-key': apiKey,
          'hf-secret': apiSecret,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Status check failed with status ${statusResponse.status}`);
      }

      const status = await statusResponse.json();
      console.log(`[Higgsfield] Poll attempt ${attempt + 1}:`, status.status);

      if (status.status === "completed") {
        if (status.images && status.images.length > 0) {
          return {
            url: status.images[0].url || status.images[0],
          };
        }
      }

      if (status.status === "failed") {
        throw new Error(status.error || status.message || "Image generation failed");
      }

      if (status.status === "nsfw") {
        throw new Error("Content was flagged as NSFW");
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error: any) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error("Image generation timed out");
}

/**
 * Generate a video from an image using Higgsfield image-to-video
 * @param imageUrl - URL of the image to use
 * @param prompt - Video generation prompt (camera movement, etc.)
 * @param options - Additional options
 */
export async function generateVideo(
  imageUrl: string,
  prompt: string,
  options: {
    model?: "dop-turbo" | "dop";
    duration?: number;
  } = {}
): Promise<{ url?: string; videoId?: string; status?: string }> {
  if (!credentials) {
    throw new Error("Higgsfield credentials not configured. Set HF_CREDENTIALS or HF_API_KEY/HF_API_SECRET environment variables.");
  }

  try {
    const response: V2Response = await higgsfield.subscribe('/v1/image2video/dop', {
      input: {
        model: options.model || "dop-turbo",
        prompt: prompt || "Cinematic camera movement",
        input_images: [{
          type: "image_url",
          image_url: imageUrl,
        }],
      },
      withPolling: true,
    });

    if (response.status === "completed") {
      if (response.video?.url) {
        return {
          url: response.video.url,
          videoId: response.request_id,
          status: "completed",
        };
      }
    }

    if (response.status === "failed") {
      throw new Error("Video generation failed");
    }

    if (response.status === "nsfw") {
      throw new Error("Content was flagged as NSFW");
    }

    throw new Error(`Video generation did not complete successfully. Status: ${response.status}`);
  } catch (error: any) {
    console.error("Error generating video with Higgsfield:", error);
    throw error;
  }
}

/**
 * Generate speech-to-video (lipsync) using Higgsfield Speak
 * @param imageUrl - URL of the image/avatar to use
 * @param audioUrl - URL of the audio file (WAV format)
 * @param prompt - Video generation prompt
 * @param options - Additional options
 */
export async function generateSpeechToVideo(
  imageUrl: string,
  audioUrl: string,
  prompt: string,
  options: {
    quality?: "low" | "mid" | "high";
    duration?: "short" | "medium" | "long";
  } = {}
): Promise<{ url?: string; videoId?: string; status?: string }> {
  if (!credentials) {
    throw new Error("Higgsfield credentials not configured. Set HF_CREDENTIALS or HF_API_KEY/HF_API_SECRET environment variables.");
  }

  try {
    const response: V2Response = await higgsfield.subscribe('/v1/speak/higgsfield', {
      input: {
        input_image: {
          type: "image_url",
          image_url: imageUrl,
        },
        input_audio: {
          type: "audio_url",
          audio_url: audioUrl,
        },
        prompt: prompt || "Professional presentation style",
        quality: options.quality || "mid",
        duration: options.duration === "short" ? 5 : options.duration === "medium" ? 10 : 15,
      },
      withPolling: true,
    });

    if (response.status === "completed") {
      if (response.video?.url) {
        return {
          url: response.video.url,
          videoId: response.request_id,
          status: "completed",
        };
      }
    }

    if (response.status === "failed") {
      throw new Error("Speech-to-video generation failed");
    }

    if (response.status === "nsfw") {
      throw new Error("Content was flagged as NSFW");
    }

    throw new Error(`Speech-to-video generation did not complete successfully. Status: ${response.status}`);
  } catch (error: any) {
    console.error("Error generating speech-to-video with Higgsfield:", error);
    throw error;
  }
}

/**
 * Generate voice/audio using text-to-speech (if available)
 * Note: This is a placeholder - check Higgsfield docs for TTS endpoint
 * @param text - Text to convert to speech
 * @param voiceId - Voice ID to use
 * @param options - Additional options
 */
export async function generateVoice(
  text: string,
  voiceId?: string,
  options: {
    speed?: number;
    pitch?: number;
    style?: string;
  } = {}
): Promise<{ url?: string; audioId?: string; data?: string }> {
  // Note: Higgsfield SDK doesn't have a direct TTS endpoint in the docs
  // You may need to use a separate TTS service (like ElevenLabs) or check if Higgsfield has TTS
  // For now, return an error suggesting to use external TTS
  throw new Error("Text-to-speech is not directly available in Higgsfield. Please use a TTS service like ElevenLabs or generate audio separately.");
}

/**
 * Check the status of a video generation job
 * @param videoId - The video ID (request_id) returned from generateVideo
 */
export async function getVideoStatus(videoId: string): Promise<{
  status: "queued" | "in_progress" | "completed" | "failed" | "nsfw";
  url?: string;
  progress?: number;
}> {
  if (!credentials) {
    throw new Error("Higgsfield credentials not configured");
  }

  try {
    // The SDK handles polling internally, but we can check status manually if needed
    // For now, return a basic status - you might need to implement a custom status check
    return {
      status: "completed", // This would need to be fetched from the API
    };
  } catch (error: any) {
    console.error("Error checking video status:", error);
    throw error;
  }
}

/**
 * List available voices
 * Note: This might not be available in Higgsfield - check docs
 */
export async function listVoices(): Promise<Array<{
  id: string;
  name: string;
  gender?: string;
  language?: string;
}>> {
  // Higgsfield doesn't have a voices endpoint in the SDK
  // You might need to use a separate service for voice selection
  // Return empty array for now
  return [];
}
