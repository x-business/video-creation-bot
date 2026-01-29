// Vercel serverless function entry point
// This wraps the Express app for Vercel deployment

// Set VERCEL env var so server knows it's running on Vercel
process.env.VERCEL = "1";

// Import the Express app
// The app initializes asynchronously in server/index.ts
// Vercel will handle the async initialization
import app from "../server/index";

// Export the Express app as a serverless function
// Vercel will use this as the handler
export default app;
