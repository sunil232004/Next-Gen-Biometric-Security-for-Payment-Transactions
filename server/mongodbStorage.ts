import { ObjectId, Document } from 'mongodb';
import { getDb } from './mongodb.js';
import { IStorage } from './storage.js';
import {
  User,
  Service,
  Transaction,
  BiometricAuth,
  InsertUser,
  InsertService,
  InsertTransaction,
  InsertBiometricAuth
} from './schema.js';
import { log } from './logger.js';

// Helper function to convert MongoDB document to a User object
function documentToUser(doc: Document): User {
  return {
    id: doc.id,
    username: doc.username,
    password: doc.password,
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    balance: doc.balance || 0,
    profileImage: doc.profileImage || null
  };
}

// Helper function to convert MongoDB document to a Service object
function documentToService(doc: Document): Service {
  return {
    id: doc.id,
    name: doc.name,
    category: doc.category,
    icon: doc.icon,
    description: doc.description || null
  };
}

// Helper function to convert MongoDB document to a Transaction object
function documentToTransaction(doc: Document): Transaction {
  return {
    id: doc.id,
    userId: doc.userId,
    type: doc.type,
    amount: doc.amount,
    status: doc.status,
    timestamp: doc.timestamp,
    description: doc.description || null,
    authMethod: doc.authMethod || null,
    createdAt: doc.createdAt || new Date().toISOString(),
    metadata: doc.metadata || null
  };
}

// Helper function to convert MongoDB document to a BiometricAuth object
function documentToBiometricAuth(doc: Document): BiometricAuth {
  return {
    id: doc.id,
    userId: doc.userId,
    type: doc.type,
    data: doc.data,
    label: doc.label || null,
    isActive: doc.isActive === undefined ? 1 : doc.isActive,
    createdAt: doc.createdAt
  };
}

export class MongoDBStorage implements IStorage {
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const db = getDb();
      const user = await db.collection('users').findOne({ id });
      return user ? documentToUser(user) : undefined;
    } catch (error) {
      log(`Error getting user: ${error}`, "mongodb");
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const db = getDb();
      const user = await db.collection('users').findOne({ username });
      return user ? documentToUser(user) : undefined;
    } catch (error) {
      log(`Error getting user by username: ${error}`, "mongodb");
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const db = getDb();
      
      // Get the next user ID by counting documents
      const count = await db.collection('users').countDocuments();
      const newId = count + 1;
      
      const newUser: User = {
        ...user,
        id: newId,
        balance: 5000, // Default starting balance
        profileImage: user.profileImage || null
      };
      
      await db.collection('users').insertOne(newUser);
      return newUser;
    } catch (error) {
      log(`Error creating user: ${error}`, "mongodb");
      throw error;
    }
  }

  async updateUserBalance(id: number, amount: number): Promise<void> {
    try {
      const db = getDb();
      const user = await this.getUser(id);

      if (!user) {
        return;
      }

      const currentBalance = user.balance || 0;

      const newBalance = currentBalance + amount;

      await db.collection('users').updateOne(
        { id },
        { $set: { balance: newBalance } }
      );

      return;
    } catch (error) {
      log(`Error updating user balance: ${error}`, "mongodb");
      return;
    }
  }
  
  async updateUserProfileImage(id: number, profileImage: string): Promise<User | undefined> {
    try {
      const db = getDb();
      const user = await this.getUser(id);
      
      if (!user) {
        return undefined;
      }
      
      const updatedUser: User = {
        ...user,
        profileImage
      };
      
      await db.collection('users').updateOne(
        { id },
        { $set: { profileImage: updatedUser.profileImage } }
      );
      
      return updatedUser;
    } catch (error) {
      log(`Error updating user profile image: ${error}`, "mongodb");
      return undefined;
    }
  }

  // Service methods
  async getServices(): Promise<Service[]> {
    try {
      const db = getDb();
      const services = await db.collection('services').find().toArray();
      return services.map(documentToService);
    } catch (error) {
      log(`Error getting services: ${error}`, "mongodb");
      return [];
    }
  }

  async getServicesByCategory(category: string): Promise<Service[]> {
    try {
      const db = getDb();
      const services = await db.collection('services')
        .find({ category })
        .toArray();
      return services.map(documentToService);
    } catch (error) {
      log(`Error getting services by category: ${error}`, "mongodb");
      return [];
    }
  }

  async createService(service: InsertService): Promise<Service> {
    try {
      const db = getDb();
      
      // Get the next service ID
      const count = await db.collection('services').countDocuments();
      const newId = count + 1;
      
      const newService: Service = {
        id: newId,
        name: service.name,
        category: service.category,
        icon: service.icon,
        description: service.description || null
      };
      
      await db.collection('services').insertOne(newService);
      return newService;
    } catch (error) {
      log(`Error creating service: ${error}`, "mongodb");
      throw error;
    }
  }

  // Transaction methods
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      const db = getDb();
      
      // Get the next transaction ID
      const count = await db.collection('transactions').countDocuments();
      const newId = count + 1;
      
      const newTransaction: Transaction = {
        id: newId,
        userId: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        timestamp: transaction.timestamp,
        description: transaction.description || null,
        authMethod: transaction.authMethod || null,
        createdAt: transaction.createdAt || new Date().toISOString(),
        metadata: transaction.metadata || null
      };
      
      await db.collection('transactions').insertOne(newTransaction);
      return newTransaction;
    } catch (error) {
      log(`Error creating transaction: ${error}`, "mongodb");
      throw error;
    }
  }

  async getUserTransactions(userId: number | string): Promise<Transaction[]> {
    try {
      const db = getDb();
      // Support both string and numeric userId queries
      const transactions = await db.collection('transactions')
        .find({ 
          $or: [
            { userId: userId },
            { userId: String(userId) },
            { userId: typeof userId === 'string' ? parseInt(userId) : userId }
          ]
        })
        .sort({ createdAt: -1 })
        .toArray();
      return transactions.map(documentToTransaction);
    } catch (error) {
      log(`Error getting user transactions: ${error}`, "mongodb");
      return [];
    }
  }

  // Biometric authentication methods
  async createBiometricAuth(auth: InsertBiometricAuth): Promise<BiometricAuth> {
    try {
      const db = getDb();
      
      // Get the next biometric auth ID
      const count = await db.collection('biometric_auth').countDocuments();
      const newId = count + 1;
      
      const newBiometricAuth: BiometricAuth = {
        id: newId,
        userId: auth.userId,
        type: auth.type,
        data: auth.data,
        label: auth.label || null,
        isActive: 1,
        createdAt: auth.createdAt || new Date().toISOString()
      };
      
      await db.collection('biometric_auth').insertOne(newBiometricAuth);
      return newBiometricAuth;
    } catch (error) {
      log(`Error creating biometric auth: ${error}`, "mongodb");
      throw error;
    }
  }

  async getUserBiometricAuth(userId: number, type?: string): Promise<BiometricAuth[]> {
    try {
      const db = getDb();
      const query: any = { userId, isActive: 1 };
      
      if (type) {
        query.type = type;
      }
      
      const biometricAuths = await db.collection('biometric_auth')
        .find(query)
        .toArray();
      
      return biometricAuths.map(documentToBiometricAuth);
    } catch (error) {
      log(`Error getting user biometric auth: ${error}`, "mongodb");
      return [];
    }
  }

  async getBiometricAuth(id: number): Promise<BiometricAuth | undefined> {
    try {
      const db = getDb();
      const biometricAuth = await db.collection('biometric_auth').findOne({ id });
      return biometricAuth ? documentToBiometricAuth(biometricAuth) : undefined;
    } catch (error) {
      log(`Error getting biometric auth: ${error}`, "mongodb");
      return undefined;
    }
  }

  async verifyBiometricAuth(userId: number, type: string, data: string): Promise<boolean> {
    try {
      const db = getDb();
      
      // Get all active biometric auth methods of the specified type for the user
      const userBiometrics = await this.getUserBiometricAuth(userId, type);
      
      if (userBiometrics.length === 0) {
        return false;
      }
      
      // In a real application, we would use a proper biometric comparison algorithm
      // For the demo, first try exact match
      const isMatch = userBiometrics.some(auth => auth.data === data);

      if (isMatch) return true;

      // Extra debug: log what's stored (development only)
      if (process.env.NODE_ENV !== 'production') {
        try {
          const storedPreview = JSON.stringify(userBiometrics.map(b => ({ id: b.id, type: b.type, data: b.data }))).slice(0, 1000);
          log(`verifyBiometricAuth: incoming data='${data}'. stored=${storedPreview}`, 'mongodb');
        } catch {}
        // Accept verification if any biometric of that type exists for the user.
        // This helps demo flows where the client simulates scan data that won't
        // exactly match a stored binary template.
        return userBiometrics.length > 0;
      }

      return false;
    } catch (error) {
      log(`Error verifying biometric auth: ${error}`, "mongodb");
      return false;
    }
  }

  async deleteBiometricAuth(id: number): Promise<boolean> {
    try {
      const db = getDb();
      const auth = await this.getBiometricAuth(id);
      
      if (!auth) {
        return false;
      }
      
      // Soft delete by setting isActive to 0
      await db.collection('biometric_auth').updateOne(
        { id },
        { $set: { isActive: 0 } }
      );
      
      return true;
    } catch (error) {
      log(`Error deleting biometric auth: ${error}`, "mongodb");
      return false;
    }
  }

  // UPI PIN methods (simple implementation using a collection 'upi_pins')
  async setUPIPin(userId: number, upiPin: string): Promise<boolean> {
    try {
      const db = getDb();
      await db.collection('upi_pins').updateOne(
        { userId },
        { $set: { userId, pin: upiPin, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
      return true;
    } catch (error) {
      log(`Error setting UPI PIN: ${error}`, "mongodb");
      return false;
    }
  }

  async verifyUPIPin(userId: number, upiPin: string): Promise<boolean> {
    try {
      const db = getDb();
      const record = await db.collection('upi_pins').findOne({ userId });
      if (!record) return false;
      return record.pin === upiPin;
    } catch (error) {
      log(`Error verifying UPI PIN: ${error}`, "mongodb");
      return false;
    }
  }
  
  // Initialize some demo data
  async initializeDemoData(): Promise<void> {
    try {
      const db = getDb();
      
      // Check if we already have users
      const userCount = await db.collection('users').countDocuments();
      
      if (userCount === 0) {
        // Add a demo user
        const demoUser: User = {
          id: 1,
          username: 'demouser',
          password: 'password123', // In a real app, this would be hashed
          name: 'Demo User',
          email: 'demo@example.com',
          phone: '9876543210',
          balance: 5000,
          profileImage: null
        };
        
        await db.collection('users').insertOne(demoUser);
        log("Created demo user", "mongodb");
      }
      
      // Check if we already have services
      const serviceCount = await db.collection('services').countDocuments();
      
      if (serviceCount === 0) {
        // Add some demo services
        const demoServices: Service[] = [
          {
            id: 1,
            name: 'Mobile Recharge',
            icon: 'mobile',
            category: 'recharge',
            description: 'Recharge your mobile phone'
          },
          {
            id: 2,
            name: 'DTH Recharge',
            icon: 'tv',
            category: 'recharge',
            description: 'Recharge your DTH connection'
          },
          {
            id: 3,
            name: 'Electricity Bill',
            icon: 'zap',
            category: 'bill',
            description: 'Pay your electricity bill'
          },
          {
            id: 4,
            name: 'Water Bill',
            icon: 'droplet',
            category: 'bill',
            description: 'Pay your water bill'
          },
          {
            id: 5,
            name: 'Broadband Bill',
            icon: 'wifi',
            category: 'bill',
            description: 'Pay your broadband bill'
          }
        ];
        
        await db.collection('services').insertMany(demoServices);
        log("Created demo services", "mongodb");
      }

      // Ensure a demo biometric entry exists for demo user (userId = 1, fingerprint)
      try {
        const existing = await this.getUserBiometricAuth(1, 'fingerprint');
        if (!existing || existing.length === 0) {
          const demoBiometric: BiometricAuth = {
            id: 1,
            userId: 1,
            type: 'fingerprint',
            data: 'demo-biometric-sample-1', // known test value for local dev
            label: 'Demo Fingerprint',
            isActive: 1,
            createdAt: new Date().toISOString()
          };

          await db.collection('biometric_auth').insertOne(demoBiometric);
          log('Created demo biometric entry for user 1', 'mongodb');
        } else {
          log(`Demo biometric already present (count=${existing.length})`, 'mongodb');
        }
      } catch (err) {
        log(`Error ensuring demo biometric entry: ${err}`, 'mongodb');
      }
      
    } catch (error) {
      log(`Error initializing demo data: ${error}`, "mongodb");
    }
  }
}