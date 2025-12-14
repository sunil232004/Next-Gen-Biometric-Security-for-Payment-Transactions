import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectToDatabase, createCollections, closeConnection } from "./mongodb";
import { MongoDBStorage } from "./mongodbStorage";
import { exec } from 'child_process';
import { platform } from 'os';
import http from 'http';
import { WebSocketServer } from 'ws';

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

    // Setup Vite in development mode
    if (process.env.NODE_ENV !== 'production') {
      await setupVite(app, httpServer);
    } else {
      serveStatic(app);
    }

    isInitialized = true;

    // Start the server
    const port = process.env.PORT || 5001;
    httpServer.listen(port, () => {
      log(`Server running at http://localhost:${port}`);
      
      // Open browser automatically in development mode
      if (process.env.NODE_ENV !== 'production') {
        const url = `http://localhost:${port}`;
        const openCommand = platform() === 'win32' ? 'start' : platform() === 'darwin' ? 'open' : 'xdg-open';
        exec(`${openCommand} ${url}`, (error) => {
          if (error) {
            log(`Failed to open browser: ${error.message}`);
          }
        });
      }
    });
  } catch (error) {
    log(`Failed to initialize the app: ${error}`, 'express');
    throw error;
  }
}

// Initialize the app
initializeApp();

// Export the Express API
export default app;