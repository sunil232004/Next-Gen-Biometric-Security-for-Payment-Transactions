import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { connectToDatabase, createCollections, closeConnection } from "./mongodb";
import { MongoDBStorage } from "./mongodbStorage";
import http from 'http';
import { WebSocketServer } from 'ws';

// Simple log function
function log(message: string, source = 'server') {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Initialize MongoDB storage
export const mongoStorage = new MongoDBStorage();

const app = express();
const httpServer = http.createServer(app);

// Create WebSocket server on a dedicated path to avoid colliding with Vite's HMR
export const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  log('Client connected');

  ws.on('close', () => {
    log('Client disconnected');
  });
});

// CORS configuration - allow frontend to connect from different origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173', // Vite default port
  process.env.FRONTEND_URL, // Production frontend URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Increase JSON payload limit to 10MB to handle biometric data (like face images)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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

      log(logLine);
    }
  });

  next();
});

// Graceful shutdown function
function gracefulShutdown() {
  log('Shutting down gracefully...', 'mongodb');
  closeConnection()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      log(`Error during shutdown: ${err}`, 'mongodb');
      process.exit(1);
    });
}

// Handle app termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Initialize the app
let isInitialized = false;
async function initializeApp() {
  if (isInitialized) return;
  
  try {
    // Connect to MongoDB first
    const db = await connectToDatabase();
    
    // Create collections if they don't exist
    await createCollections();
    
    // Initialize demo data
    await mongoStorage.initializeDemoData();
    
    // Register routes after DB connection is established
    await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    isInitialized = true;
  } catch (error) {
    log(`Failed to initialize the app: ${error}`, 'express');
    throw error;
  }
}

// Check if running on Vercel or locally
const isVercel = !!process.env.VERCEL;

if (!isVercel) {
  // Local development - listen on a port
  initializeApp().then(() => {
    const port = process.env.PORT || 5000;
    httpServer.listen(port, () => {
      log(`Server running at http://localhost:${port}`);
    });
  }).catch(err => {
    log(`Failed to start server: ${err}`, 'express');
    process.exit(1);
  });
}

// Export the Express app for both Vercel and local use
export default app;

// Export handler for Vercel
export async function handler(req: any, res: any) {
  await initializeApp();
  return app(req, res);
}