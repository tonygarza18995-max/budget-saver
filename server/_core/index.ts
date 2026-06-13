import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";

// Deployment version: 2026-05-14T06:30 (force cache bust)
// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Catch unhandled errors to prevent silent crashes in production
process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught exception:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("[FATAL] Unhandled rejection:", err);
});

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Custom robots.txt that allows Google to crawl the landing page
  // The platform's root robots.txt blocks /api/* by default, so we serve
  // our own at /api/robots.txt to override it for crawlers that check both
  app.get("/api/robots.txt", (_req, res) => {
    res.type("text/plain").send(
      `User-Agent: *\nAllow: /\n\nSitemap: https://budgetsavr-arqfzywu.manus.space/api/web/sitemap.xml`
    );
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ error }) => {
        console.error("[tRPC Error]", error.message);
      },
    }),
  );

  // Serve static web files in production under /api/web prefix
  // The Manus platform reverse proxy only forwards /api/* to Express,
  // so we must serve all web content under /api/web/
  if (process.env.NODE_ENV === "production") {
    // Try multiple possible locations for dist-web
    // Priority: dist/dist-web (built by build script, always fresh) > root dist-web
    const candidates = [
      path.join(__dirname, "dist-web"),              // dist/dist-web (copied by build script)
      path.join(__dirname, "..", "dist-web"),       // dist/index.js -> ../dist-web
      path.join(process.cwd(), "dist-web"),          // cwd/dist-web
      path.join(process.cwd(), "..", "dist-web"),   // parent/dist-web
    ];

    let webDist: string | null = null;
    for (const candidate of candidates) {
      const indexCheck = path.join(candidate, "index.html");
      if (fs.existsSync(indexCheck)) {
        webDist = candidate;
        console.log(`[web] Serving static files from: ${candidate}`);
        break;
      }
    }

    // Debug endpoint to help diagnose path issues
    app.get("/api/debug-paths", (_req, res) => {
      res.json({
        cwd: process.cwd(),
        dirname: __dirname,
        candidates: candidates.map(c => ({ path: c, exists: fs.existsSync(c), hasIndex: fs.existsSync(path.join(c, "index.html")) })),
        webDist,
        env: process.env.NODE_ENV,
      });
    });

    if (webDist) {
      // Serve static assets under /api/web prefix
      app.use("/api/web", express.static(webDist));

      // SPA fallback — serve index.html for all /api/web routes that don't match a static file
      app.get("/api/web/*", (_req, res) => {
        const indexPath = path.join(webDist!, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("Not Found");
        }
      });

      // Redirect root /api/web to serve index.html
      app.get("/api/web", (_req, res) => {
        const indexPath = path.join(webDist!, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("Not Found");
        }
      });

      console.log(`[web] Static files mounted at /api/web`);
    } else {
      console.error(`[web] dist-web not found! Tried: ${candidates.join(", ")}`);
      app.get("/api/web", (_req, res) => {
        res.status(404).send(`Static files not found. Tried: ${candidates.join(", ")}`);
      });
      app.get("/api/web/*", (_req, res) => {
        res.status(404).send(`Static files not found. Tried: ${candidates.join(", ")}`);
      });
    }
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
