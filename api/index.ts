import express from "express";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
        }
    });

    next();
});

// Create a dummy http server for registerRoutes (it expects one)
const httpServer = createServer(app);

// Register all API routes (async but we don't await - routes register synchronously)
registerRoutes(httpServer, app).catch(err => {
    console.error("Failed to register routes:", err);
});

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("API Error:", err);
    if (res.headersSent) return next(err);
    res.status(status).json({ message });
});

export default app;
