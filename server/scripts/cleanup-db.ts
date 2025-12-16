/**
 * Database Cleanup Script
 * 
 * This script will:
 * 1. Connect to MongoDB
 * 2. Drop all existing collections
 * 3. Create fresh collections with indexes
 * 
 * Run with: npx tsx scripts/cleanup-db.ts
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://arkprk:2468@rakeshrk.fshrk.mongodb.net/';
const DB_NAME = 'paytm_clone';

async function cleanupDatabase() {
  console.log('🔄 Connecting to MongoDB...');
  console.log(`   Using URI: ${MONGODB_URI.substring(0, 30)}...`);
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);

    // Get all existing collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📋 Found ${collections.length} collections:`);
    collections.forEach(c => console.log(`   - ${c.name}`));

    // Drop all collections
    console.log('\n🗑️  Dropping all collections...');
    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`   ✓ Dropped: ${collection.name}`);
    }

    // Create new collections with indexes
    console.log('\n🔨 Creating new collections with indexes...');

    // Users collection
    await db.createCollection('users');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ upiId: 1 }, { unique: true });
    await db.collection('users').createIndex({ phone: 1 }, { sparse: true });
    console.log('   ✓ Created: users (with email, upiId, phone indexes)');

    // Sessions collection
    await db.createCollection('sessions');
    await db.collection('sessions').createIndex({ token: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ userId: 1 });
    await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log('   ✓ Created: sessions (with token, userId, expiresAt indexes)');

    // Transactions collection
    await db.createCollection('transactions');
    await db.collection('transactions').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('transactions').createIndex({ status: 1 });
    await db.collection('transactions').createIndex({ type: 1 });
    console.log('   ✓ Created: transactions (with userId+createdAt, status, type indexes)');

    // Biometrics collection
    await db.createCollection('biometrics');
    await db.collection('biometrics').createIndex({ userId: 1 });
    await db.collection('biometrics').createIndex({ userId: 1, type: 1 }, { unique: true });
    console.log('   ✓ Created: biometrics (with userId, userId+type indexes)');

    // Services collection (for legacy support)
    await db.createCollection('services');
    await db.collection('services').createIndex({ category: 1 });
    console.log('   ✓ Created: services (with category index)');

    console.log('\n✅ Database cleanup complete!');
    console.log('\n📊 New collection structure:');
    const newCollections = await db.listCollections().toArray();
    newCollections.forEach(c => console.log(`   - ${c.name}`));

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupDatabase();
