/**
 * Higgs Field API Client
 * 
 * Higgs Field is used for:
 * - Image generation
 * - Video generation (Lipsync Studio)
 * - Voice/audio generation
 * 
 * Note: Update the API endpoints and authentication method based on
 * the actual Higgs Field API documentation.
 */

const HIGGS_FIELD_API_KEY = process.env.HIGGS_FIELD_API_KEY;
const HIGGS_FIELD_BASE_URL = process.env.HIGGS_FIELD_BASE_URL || "https://api.higgsfield.ai";

if (!HIGGS_FIELD_API_KEY) {
  console.warn("Warning: HIGGS_FIELD_API_KEY not set. Higgs Field features will not work.");
}

/**
 * Make an authenticated request to the Higgs Field API
 */
async function higgsRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!HIGGS_FIELD_API_KEY) {
    throw new Error("HIGGS_FIELD_API_KEY is not configured");
  }

  const url = `${HIGGS_FIELD_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${HIGGS_FIELD_API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`Higgs Field API error: ${response.status} ${error}`);
  }

  return response;
}

/**
 * Generate an image using Higgs Field
 * @param prompt - Text description of the image to generate
 * @param options - Additional options (size, style, etc.)
 */
export async function generateImage(
  prompt: string,
  options: {
    size?: "1024x1024" | "512x512" | "256x256";
    style?: string;
  } = {}
): Promise<{ url?: string; data?: string; buffer?: Buffer }> {
  // TODO: Update this endpoint based on actual Higgs Field API documentation
  const response = await higgsRequest("/v1/images/generate", {
    method: "POST",
    body: JSON.stringify({
      prompt,
      size: options.size || "1024x1024",
      style: options.style,
    }),
  });

  const data = await response.json();
  return data;
}

/**
 * Generate a video using Higgs Field Lipsync Studio
 * @param imageUrl - URL or path to the image to use
 * @param script - Script text for the video
 * @param voiceId - Voice ID to use (optional)
 * @param options - Additional options
 */
export async function generateVideo(
  imageUrl: string,
  script: string,
  voiceId?: string,
  options: {
    duration?: number; // in seconds
    style?: string;
  } = {}
): Promise<{ url?: string; videoId?: string; status?: string }> {
  // TODO: Update this endpoint based on actual Higgs Field API documentation
  const response = await higgsRequest("/v1/videos/lipsync", {
    method: "POST",
    body: JSON.stringify({
      image_url: imageUrl,
      script,
      voice_id: voiceId,
      duration: options.duration || 10,
      style: options.style,
    }),
  });

  const data = await response.json();
  return data;
}

/**
 * Generate voice/audio using Higgs Field
 * @param text - Text to convert to speech
 * @param voiceId - Voice ID to use
 * @param options - Additional options (speed, pitch, etc.)
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
  // TODO: Update this endpoint based on actual Higgs Field API documentation
  const response = await higgsRequest("/v1/audio/generate", {
    method: "POST",
    body: JSON.stringify({
      text,
      voice_id: voiceId,
      speed: options.speed || 1.0,
      pitch: options.pitch || 1.0,
      style: options.style,
    }),
  });

  const data = await response.json();
  return data;
}

/**
 * Check the status of a video generation job
 * @param videoId - The video ID returned from generateVideo
 */
export async function getVideoStatus(videoId: string): Promise<{
  status: "pending" | "processing" | "completed" | "failed";
  url?: string;
  progress?: number;
}> {
  // TODO: Update this endpoint based on actual Higgs Field API documentation
  const response = await higgsRequest(`/v1/videos/${videoId}/status`);
  const data = await response.json();
  return data;
}

/**
 * List available voices
 */
export async function listVoices(): Promise<Array<{
  id: string;
  name: string;
  gender?: string;
  language?: string;
}>> {
  // TODO: Update this endpoint based on actual Higgs Field API documentation
  const response = await higgsRequest("/v1/voices");
  const data = await response.json();
  return data.voices || data || [];
}
