import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import http from "http";
import { registerRoutes } from "./routes.js";
import { connectToDatabase, createCollections, closeConnection } from "./mongodb.js";
import { MongoDBStorage } from "./mongodbStorage.js";

const isVercel = !!process.env.VERCEL;

// Simple log function
function log(message: string, source = 'server') {
  console.log(`[${source}] ${message}`);
}

// Initialize MongoDB storage
export const mongoStorage = new MongoDBStorage();

const app = express();
const httpServer = !isVercel ? http.createServer(app) : null;

// CORS configuration - Handle preflight and all requests
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://next-gen-biometric-security-for-pay.vercel.app',
  'https://next-gen-biometric-security-for-pay-frontend.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

// Handle preflight OPTIONS requests explicitly
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || !origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(204).end();
});

// Apply CORS to all requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || !origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// Increase JSON payload limit to 10MB to handle biometric data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Favicon routes - return a simple 1x1 transparent PNG to prevent 404 errors
const FAVICON_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#00239C;stop-opacity:1" />
    <stop offset="100%" style="stop-color:#0d4bb5;stop-opacity:1" />
  </linearGradient></defs>
  <rect width="100" height="100" rx="20" fill="url(#grad)"/>
  <text x="50" y="68" font-family="Arial" font-size="50" font-weight="bold" fill="white" text-anchor="middle">P</text>
  <circle cx="75" cy="25" r="12" fill="#00D09C"/>
</svg>`;

app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.send(FAVICON_PNG);
});

app.get('/favicon.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.send(FAVICON_PNG);
});

app.get('/favicon.svg', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.send(FAVICON_SVG);
});

// Health check (before initialization)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', initialized: isInitialized, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Biometric Payment API', initialized: isInitialized });
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
  closeConnection()
    .then(() => {
      if (httpServer) {
        httpServer.close(() => process.exit(0));
      } else {
        process.exit(0);
      }
    })
    .catch(() => process.exit(1));
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

      // Catch-all 404 handler
      app.use((req, res) => {
        console.log(`[404] ${req.method} ${req.url}`);
        res.status(404).json({ message: 'Not Found', path: req.url });
      });

      // Error handler
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        console.error('[Error Handler]', err);
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
    console.log(`[handler] ${req.method} ${req.url}`);
    await initializeApp();
    console.log('[handler] App initialized, calling Express handler');
    return app(req, res);
  } catch (error: any) {
    console.error('[handler] Initialization error:', error);
    console.error('[handler] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Server initialization failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// For local development
if (!isVercel && httpServer) {
  initializeApp().then(async () => {
    const basePort = parseInt(process.env.PORT || '5000', 10);
    const maxTries = 10;
    let currentPort = basePort;

    // Attach error handlers to avoid unhandled 'error' events
    httpServer.on('error', (err: any) => {
      log(`HTTP server error: ${err?.message || err}`, 'server');
    });
    // Try binding to a free port, incrementing if in use
    for (let attempt = 0; attempt < maxTries; attempt++) {
      try {
        await new Promise<void>((resolve, reject) => {
          // Use once so we don't leak listeners across attempts
          const onError = (err: any) => {
            httpServer.off('listening', onListening);
            reject(err);
          };
          const onListening = () => {
            httpServer.off('error', onError);
            resolve();
          };
          httpServer.once('error', onError);
          httpServer.once('listening', onListening);
          httpServer.listen(currentPort);
        });

        log(`Server running at http://localhost:${currentPort}`);
        break; // success
      } catch (err: any) {
        if (err && err.code === 'EADDRINUSE') {
          log(`Port ${currentPort} in use, trying ${currentPort + 1}`, 'server');
          currentPort += 1;
          // Wait briefly before retrying
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
        log(`Failed to start: ${err}`, 'server');
        process.exit(1);
      }
    }
  }).catch(err => {
    log(`Failed to initialize app: ${err}`, 'server');
    process.exit(1);
  });
}