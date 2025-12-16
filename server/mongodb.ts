import { MongoClient, Db } from 'mongodb';
import { log } from './logger.js';
import { PAYMENTS_COLLECTION } from './models/payment.js';

let client: MongoClient;
let db: Db | any;

// Create a minimal in-memory mock DB as a fallback when a real MongoDB
// connection isn't available. This supports a small subset of calls used
// by the app (collection, findOne, insertOne, countDocuments, find,
// insertMany, updateOne, listCollections, createCollection).
function createMockDb() {
  const collections = new Map<string, any[]>();

  function ensureCollection(name: string) {
    if (!collections.has(name)) collections.set(name, []);
    return collections.get(name)!;
  }

  return {
    listCollections: async () => {
      return { toArray: async () => Array.from(collections.keys()).map(name => ({ name })) };
    },
    collection: (name: string) => {
      const items = ensureCollection(name);

      return {
        findOne: async (filter: any) => {
          if (!filter) return items[0];
          return items.find((d: any) => Object.keys(filter).every(k => d[k] === filter[k]));
        },
        countDocuments: async (filter?: any) => {
          if (!filter) return items.length;
          return items.filter((d: any) => Object.keys(filter).every(k => d[k] === filter[k])).length;
        },
        insertOne: async (doc: any) => {
          items.push(doc);
          return { insertedId: doc.id };
        },
        insertMany: async (docs: any[]) => {
          docs.forEach(d => items.push(d));
          return { insertedCount: docs.length };
        },
        find: (filter?: any) => {
          const results = filter ? items.filter((d: any) => Object.keys(filter).every(k => d[k] === filter[k])) : items.slice();
          return { toArray: async () => results };
        },
        updateOne: async (filter: any, update: any) => {
          const idx = items.findIndex((d: any) => Object.keys(filter).every(k => d[k] === filter[k]));
          if (idx === -1) return { matchedCount: 0, modifiedCount: 0 };
          if (update.$set) {
            items[idx] = { ...items[idx], ...update.$set };
          }
          return { matchedCount: 1, modifiedCount: 1 };
        },
        sort: () => ({ toArray: async () => items.slice() })
      };
    },
    createCollection: async (name: string) => {
      ensureCollection(name);
      return { ok: 1 };
    }
  };
}

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;
  const uri = process.env.MONGODB_URI || 'mongodb+srv://arkprk:2468@rakeshrk.fshrk.mongodb.net/';

  // Try connecting a few times before falling back to the in-memory mock DB.
  const maxAttempts = 3;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxAttempts) {
    try {
      attempt++;
      client = new MongoClient(uri);
      await client.connect();

      db = client.db('paytm_clone');
      log(`Connected to MongoDB (${uri}) on attempt ${attempt}`, 'mongodb');
      return db;
    } catch (error) {
      lastError = error;
      log(`MongoDB connection attempt ${attempt} failed: ${error}`, 'mongodb');
      // If we're going to retry, wait a bit to allow the DB to come up
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  // If all attempts failed, provide a clearer message and fall back to the mock DB.
  log(
    `MongoDB connection error after ${maxAttempts} attempts: ${lastError} — falling back to in-memory mock DB. If you intended to use a real MongoDB, ensure 'MONGODB_URI' is set and the DB is reachable (e.g. for local dev: run 'mongod' or start the service).`,
    'mongodb'
  );

  // Fallback to an in-memory mock database so the app can still run
  db = createMockDb();
  return db;
}

export async function createCollections(): Promise<void> {
  try {
    const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c: any) => c.name);

    // Create payments collection if it doesn't exist
    if (!collectionNames.includes(PAYMENTS_COLLECTION)) {
      await db.createCollection(PAYMENTS_COLLECTION);
      log(`Created collection: ${PAYMENTS_COLLECTION}`, 'mongodb');
    }
  } catch (error) {
    log(`Error creating collections: ${error}`, 'mongodb');
    throw error;
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase() first.');
  }
  return db;
}

export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    log('MongoDB connection closed', 'mongodb');
  }
}