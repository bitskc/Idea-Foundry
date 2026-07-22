import express from "express";
import { createServer } from "http";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

export async function setupApp() {
    const app = express();
    const httpServer = createServer(app);

    // Security headers
    app.use(helmet());

    // Stripe webhook needs raw body
    app.use("/api/webhook/stripe", express.raw({ type: "application/json" }));
    
    // Use JSON parser for all other routes
    app.use((req, res, next) => {
      if (req.path === '/api/webhook/stripe') {
        next();
      } else {
        express.json()(req, res, next);
      }
    });
    
    app.use(express.urlencoded({ extended: false }));

    // Request logging middleware
    app.use((req, res, next) => {
        const start = Date.now();
        const path = req.path;
        let capturedJsonResponse: Record<string, any> | undefined = undefined;

        const originalResJson = res.json;
        res.json = function (bodyJson, ...args) {
            capturedJsonResponse = bodyJson;
            return originalResJson.apply(res, [bodyJson, ...args]);
        };

        res.on("finish", () => {
            const duration = Date.now() - start;
            if (path.startsWith("/api")) {
                let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
                if (capturedJsonResponse) {
                    logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
                }
                console.log(logLine);
            }
        });

        next();
    });

    const server = await registerRoutes(httpServer, app);

    // Setup error handling
    app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        if (res.headersSent) return next(err);
        res.status(status).json({ message });
    });

    // Setup vite/static serving
    if (process.env.NODE_ENV === "production" && process.env.VERCEL !== "1") {
        serveStatic(app);
    } else if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
        try {
            const { setupVite } = await import("./vite");
            await setupVite(httpServer, app);
        } catch (e) {
            console.error("Vite setup failed. If testing this is expected.", e);
        }
    }

    return { app, httpServer: server };
}
