// Vercel serverless function entry point
// This wraps the Express app for Vercel deployment

// Set VERCEL env var so server knows it's running on Vercel
process.env.VERCEL = "1";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Import the app initialization function
import { initializeApp } from "../server/index";

// Initialize the app and export it
// This ensures all routes are registered before the handler is used
let appInstance: any = null;
let initPromise: Promise<any> | null = null;

async function getApp() {
  if (!initPromise) {
    initPromise = initializeApp();
    appInstance = await initPromise;
  } else if (!appInstance) {
    appInstance = await initPromise;
  }
  return appInstance;
}

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}
