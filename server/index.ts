import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { connectToDatabase, createCollections, closeConnection } from "./mongodb";
import { MongoDBStorage } from "./mongodbStorage";

const isVercel = !!process.env.VERCEL;

// Simple log function
function log(message: string, source = 'server') {
  console.log(`[${source}] ${message}`);
}

// Initialize MongoDB storage
export const mongoStorage = new MongoDBStorage();

const app = express();

// WebSocket server - only create in non-serverless environment
export let wss: any = null;
let httpServer: any = null;

if (!isVercel) {
  const http = await import('http');
  const { WebSocketServer } = await import('ws');
  httpServer = http.createServer(app);
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: any) => {
    log('Client connected');
    ws.on('close', () => {
      log('Client disconnected');
    });
  });
}

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Increase JSON payload limit to 10MB to handle biometric data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Biometric Payment API' });
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
});

// Graceful shutdown function (for local dev)
function gracefulShutdown() {
  log('Shutting down...', 'mongodb');
  closeConnection().then(() => process.exit(0)).catch(() => process.exit(1));
}

if (!isVercel) {
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

// Initialize the app
let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function initializeApp() {
  if (isInitialized) return;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      log('Connecting to MongoDB...', 'server');
      await connectToDatabase();
      
      log('Creating collections...', 'server');
      await createCollections();
      
      log('Initializing demo data...', 'server');
      await mongoStorage.initializeDemoData();
      
      log('Registering routes...', 'server');
      await registerRoutes(app);

      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        console.error('Error:', err);
        res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
      });

      isInitialized = true;
      log('App initialized', 'server');
    } catch (error) {
      log(`Init failed: ${error}`, 'server');
      initPromise = null;
      throw error;
    }
  })();
  
  return initPromise;
}

// For Vercel serverless
export default async function handler(req: Request, res: Response) {
  try {
    await initializeApp();
    return app(req, res);
  } catch (error: any) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
}

// For local development
if (!isVercel && httpServer) {
  initializeApp().then(() => {
    const port = process.env.PORT || 5000;
    httpServer.listen(port, () => {
      log(`Server running at http://localhost:${port}`);
    });
  }).catch(err => {
    log(`Failed to start: ${err}`, 'server');
    process.exit(1);
  });
}