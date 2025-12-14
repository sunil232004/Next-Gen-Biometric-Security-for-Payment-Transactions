import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { connectToDatabase, createCollections } from "../server/mongodb";
import { MongoDBStorage } from "../server/mongodbStorage";

// Initialize MongoDB storage
export const mongoStorage = new MongoDBStorage();

const app = express();

// Increase JSON payload limit to 10MB to handle biometric data (like face images)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS for Vercel deployment (allow frontend origin)
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5000',
    'http://localhost:5001',
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'production' && process.env.VERCEL_URL) {
    // Allow same-origin requests on Vercel
    res.setHeader('Access-Control-Allow-Origin', `https://${process.env.VERCEL_URL}`);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Request logging
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
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(`[api] ${logLine}`);
    }
  });

  next();
});

// Initialize database and routes
let isInitialized = false;

async function initializeApp() {
  if (isInitialized) return;

  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Create collections if they don't exist
    await createCollections();

    // Initialize demo data
    await mongoStorage.initializeDemoData();

    // Register API routes
    await registerRoutes(app);

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('[api] Error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    isInitialized = true;
    console.log('[api] App initialized successfully');
  } catch (error) {
    console.error('[api] Failed to initialize:', error);
    throw error;
  }
}

// Vercel serverless handler
export default async function handler(req: Request, res: Response) {
  await initializeApp();
  return app(req, res);
}

// Also export the app for local development
export { app };
