import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import fs from "fs";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerPdfRoute } from "../pdfRoute";
import { getReportByShareToken } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
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

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // PDF export — uses the same Chromium as the scrapers
  let boundPort = parseInt(process.env.PORT || "3000");
  registerPdfRoute(app, () => boundPort);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    // In dev, vite is loaded dynamically via a non-analyzable path
    // so esbuild won't try to bundle it
    const mod = "./vite";
    const { setupVite } = await (Function('p', 'return import(p)')(mod));
    await setupVite(app, server);
  } else {
    // Serve pre-built static files
    const distPath = path.resolve(import.meta.dirname, "public");
    if (fs.existsSync(distPath)) {
      // Inject Open Graph tags for shared report links so they unfurl nicely
      // in Slack/WhatsApp/iMessage instead of showing a blank SPA shell.
      const indexHtml = fs.readFileSync(path.resolve(distPath, "index.html"), "utf8");
      app.get("/report/:token", async (req, res, next) => {
        try {
          const report = await getReportByShareToken(String(req.params.token));
          if (!report) return next();
          const title = `${report.reportName} — Reklam İstihbarat Raporu`;
          const desc = `${report.brandCount} markanın reklam kütüphanesi analizi: kreatifler, açılar, CTA'lar ve trendler.`;
          const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
          const tags = [
            `<meta property="og:title" content="${esc(title)}" />`,
            `<meta property="og:description" content="${esc(desc)}" />`,
            `<meta property="og:type" content="website" />`,
            `<meta name="twitter:card" content="summary" />`,
          ].join("\n    ");
          res.send(indexHtml.replace("<head>", `<head>\n    ${tags}`));
        } catch {
          next();
        }
      });
      app.use(express.static(distPath));
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    } else {
      console.error(`Build directory not found: ${distPath}`);
    }
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  boundPort = port;

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
