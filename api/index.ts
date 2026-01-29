// Vercel serverless function entry point
// This wraps the Express app for Vercel deployment

// Set VERCEL env var so server knows it's running on Vercel
process.env.VERCEL = "1";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

console.log("[Vercel] Initializing API handler...");

// Import dependencies directly (Vercel will bundle these)
import express from "express";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";

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
        await registerRoutes(httpServer, app);

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
