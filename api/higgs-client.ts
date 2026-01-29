/**
 * Higgsfield SDK Client
 * 
 * Uses direct HTTP requests to Higgsfield API
 * Copied to api/ directory for Vercel deployment
 */

// Get credentials from environment variables
const credentials = process.env.HF_CREDENTIALS || 
  (process.env.HF_API_KEY && process.env.HF_API_SECRET 
    ? `${process.env.HF_API_KEY}:${process.env.HF_API_SECRET}`
    : null);

// Configure logging
if (credentials) {
  const [key, secret] = credentials.split(':');
  if (!key || !secret) {
    console.error("[Higgsfield] Error: Credentials must be in format 'KEY_ID:KEY_SECRET'");
  } else {
    console.log("[Higgsfield] SDK configured with credentials");
    console.log("[Higgsfield] Key ID (first 8 chars):", key.substring(0, 8) + "...");
  }
} else {
  console.warn("[Higgsfield] Warning: HF_CREDENTIALS or HF_API_KEY/HF_API_SECRET not set.");
}

/**
 * Poll for image generation status
 */
async function pollForImageStatus(
  requestId: string,
  apiKey: string,
  apiSecret: string,
  maxAttempts: number = 30,
  pollInterval: number = 2000
): Promise<{ url?: string; data?: string; buffer?: Buffer }> {
  const statusUrl = `https://platform.higgsfield.ai/requests/${requestId}/status`;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'hf-api-key': apiKey,
          'hf-secret': apiSecret,
        },
      });

      if (!response.ok) {
        throw new Error(`Status check failed with status ${response.status}`);
      }

      const statusData = await response.json();
      console.log(`[Higgsfield] Status check ${attempt + 1}:`, statusData.status);

      if (statusData.status === 'completed') {
        // Extract image URL from response
        if (statusData.images && Array.isArray(statusData.images) && statusData.images.length > 0) {
          const imageUrl = typeof statusData.images[0] === 'string' 
            ? statusData.images[0] 
            : statusData.images[0].url || statusData.images[0].image_url;
          if (imageUrl) {
            return { url: imageUrl };
          }
        }
        if (statusData.image_url || statusData.url) {
          return { url: statusData.image_url || statusData.url };
        }
        throw new Error("Completed but no image URL found in response");
      }

      if (statusData.status === 'failed' || statusData.status === 'nsfw') {
        throw new Error(`Generation ${statusData.status}: ${statusData.message || 'Unknown error'}`);
      }

      if (statusData.status === 'queued' || statusData.status === 'in_progress') {
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue;
      }

      // Unknown status
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error: any) {
      if (attempt === maxAttempts - 1) {
        throw new Error(`Failed to get image status after ${maxAttempts} attempts: ${error.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error(`Image generation timed out after ${maxAttempts} attempts`);
}

/**
 * Generate an image using Higgsfield Soul standard model
 * Uses direct HTTP requests with the correct header format
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

        // If we get here, we don't recognize the response format
        console.error("[Higgsfield] Unrecognized response format:", JSON.stringify(result, null, 2));
        throw new Error("Unrecognized response format from API");
      } catch (error: any) {
        lastError = error;
        if (timeoutId) clearTimeout(timeoutId);
        
        // If it's an abort error (timeout), retry
        if (error.name === 'AbortError' || error.message?.includes('timeout')) {
          console.warn(`[Higgsfield] Timeout on attempt ${attempt + 1}, retrying...`);
          if (attempt < maxRetries - 1) {
            // Exponential backoff: 2s, 4s, 6s
            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 2000));
            continue;
          }
        }
        
        // If it's a network error, retry
        if (error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED') || error.message?.includes('ETIMEDOUT')) {
          console.warn(`[Higgsfield] Network error on attempt ${attempt + 1}, retrying...`);
          if (attempt < maxRetries - 1) {
            // Exponential backoff: 2s, 4s, 6s
            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 2000));
            continue;
          }
        }
        
        // For other errors or last attempt, throw
        throw error;
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError || new Error("Failed to generate image after retries");
  } catch (error: any) {
    console.error("[Higgsfield] Error generating image:", error);
    throw error;
  }
}

/**
 * Generate a video using Higgsfield image-to-video
 */
export async function generateVideo(
  imageUrl: string,
  prompt: string = "Cinematic camera movement",
  options: {
    model?: "dop-turbo" | "dop-standard" | "dop-lite";
    duration?: number;
  } = {}
): Promise<{ url?: string; requestId?: string }> {
  const apiKey = process.env.HF_API_KEY || (credentials ? credentials.split(':')[0] : null);
  const apiSecret = process.env.HF_API_SECRET || (credentials ? credentials.split(':')[1] : null);

  if (!apiKey || !apiSecret) {
    throw new Error("Higgsfield credentials not configured. Set HF_API_KEY and HF_API_SECRET environment variables.");
  }

  try {
    const requestBody = {
      image_url: imageUrl,
      prompt: prompt,
      model: options.model || "dop-turbo",
      duration: options.duration || 5,
    };

    const response = await fetch('https://platform.higgsfield.ai/v1/image2video/dop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'hf-api-key': apiKey,
        'hf-secret': apiSecret,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${errorText}`);
    }

    const result = await response.json();
    
    if (result.video?.url) {
      return { url: result.video.url };
    }
    
    if (result.request_id || result.id) {
      return { requestId: result.request_id || result.id };
    }

    throw new Error("No video URL or request ID in response");
  } catch (error: any) {
    console.error("[Higgsfield] Error generating video:", error);
    throw error;
  }
}

// Stub functions for other endpoints (not currently used)
export async function generateSpeechToVideo(
  imageUrl: string,
  audioUrl: string,
  prompt: string = "",
  options: { quality?: string; duration?: string } = {}
): Promise<{ url?: string }> {
  throw new Error("Speech-to-video not implemented");
}

export async function generateVoice(
  text: string,
  voiceId?: string,
  options?: { speed?: number; pitch?: number; style?: string }
): Promise<{ url?: string }> {
  throw new Error("Voice generation not implemented");
}

export async function getVideoStatus(videoId: string): Promise<any> {
  throw new Error("Video status check not implemented");
}

export async function listVoices(): Promise<Array<{ id: string; name: string }>> {
  return [];
}
