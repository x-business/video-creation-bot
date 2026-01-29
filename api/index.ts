// Vercel serverless function entry point
// This wraps the Express app for Vercel deployment

// Import the Express app (it will initialize asynchronously)
// The app is exported from server/index.ts after async initialization
import app from "../server/index";

// Export the Express app as a serverless function
// Vercel will use this as the handler
export default app;
