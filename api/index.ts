// Vercel serverless function entry point
// This wraps the Express app for Vercel deployment

// Set VERCEL env var so server knows it's running on Vercel
process.env.VERCEL = "1";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Import the app initialization function
import { initializeApp } from "../server/index";

// Initialize the app once and cache it
let appInstance: any = null;
let initPromise: Promise<any> | null = null;

async function getApp() {
  if (!initPromise) {
    initPromise = initializeApp().catch((err) => {
      console.error("Failed to initialize app:", err);
      initPromise = null; // Reset on error so we can retry
      throw err;
    });
  }
  
  if (!appInstance) {
    try {
      appInstance = await initPromise;
    } catch (err) {
      console.error("Error getting app instance:", err);
      throw err;
    }
  }
  
  return appInstance;
}

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    // Call the Express app handler
    app(req, res);
  } catch (error: any) {
    console.error("Handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Internal server error", 
        message: error?.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined
      });
    }
  }
}
