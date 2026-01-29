import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  try {
    // Get the port from environment or default to 5000
    const port = parseInt(process.env.PORT || "5000", 10);
    
    const serverOptions = {
      middlewareMode: true,
      hmr: {
        server,
        path: "/vite-hmr",
        // Configure HMR to work with VPN by using the correct host
        // Use localhost for HMR client connection (works with VPN)
        clientPort: port,
      },
      // Allow all hosts to work with VPN
      allowedHosts: true as const,
      // Explicitly set host to work with VPN
      host: "0.0.0.0",
    };

    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          process.exit(1);
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    app.use(vite.middlewares);
    console.log("[vite] Vite dev server configured");

    // Catch-all route for serving the React app (must be last)
    // Use app.use() for Express 5 compatibility
    app.use(async (req, res, next) => {
      // Skip if this is an API route or static asset
      if (req.path.startsWith("/api") || req.path.startsWith("/vite-hmr")) {
        return next();
      }

      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html",
        );

        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } catch (error) {
    console.error("[vite] Failed to setup Vite:", error);
    throw error;
  }
}
