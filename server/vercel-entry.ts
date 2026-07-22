import express from "express";
import cors from "cors";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { createServer } from "http";

const app = express();

// Security headers
app.use(helmet());


// Stripe webhook needs raw body
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));

// Use JSON parser for all other routes
app.use((req, res, next) => {
  if (req.path === '/api/webhook/stripe') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: false }));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all in development
    if (process.env.NODE_ENV !== 'production') return callback(null, true);

    const allowedDomains = [
      'https://www.ideafoundry.app',
      'https://plan.ideafoundry.app',
      'https://ideafoundry.app',
    ];

    // Check if origin is in the allowed list
    if (allowedDomains.includes(origin)) return callback(null, true);

    // Allow Vercel preview deployments
    if (origin.endsWith('.vercel.app')) return callback(null, true);

    // Allow the specific Vercel deployment URL if set
    if (process.env.VERCEL_URL && origin === `https://${process.env.VERCEL_URL}`) return callback(null, true);

    console.warn(`Blocked CORS request from: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

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
