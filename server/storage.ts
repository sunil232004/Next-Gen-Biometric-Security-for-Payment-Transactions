import { 
  users, transactions, services, biometricAuth,
  type User, type InsertUser,
  type Transaction, type InsertTransaction,
  type Service, type InsertService,
  type BiometricAuth, type InsertBiometricAuth
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { MongoClient, ObjectId } from 'mongodb';

// Interface for storage methods
export interface IStorage {
  // User methods
  getUser(userId: number): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  createUser(userData: any): Promise<any>;
  updateUserBalance(userId: number, amount: number): Promise<void>;
  
  // Transaction methods
  createTransaction(transactionData: any): Promise<any>;
  getUserTransactions(userId: number): Promise<any[]>;
  
  // UPI PIN methods
  setUPIPin(userId: number, upiPin: string): Promise<boolean>;
  verifyUPIPin(userId: number, upiPin: string): Promise<boolean>;
  
  // Service methods
  getServices(): Promise<any[]>;
  getServicesByCategory(category: string): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private services: Map<number, Service>;
  private transactions: Map<number, Transaction>;
  private biometricAuths: Map<number, BiometricAuth>;
  private userIdCounter: number;
  private serviceIdCounter: number;
  private transactionIdCounter: number;
  private biometricAuthIdCounter: number;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.transactions = new Map();
    this.biometricAuths = new Map();
    this.userIdCounter = 1;
    this.serviceIdCounter = 1;
    this.transactionIdCounter = 1;
    this.biometricAuthIdCounter = 1;

    // Initialize with some demo services
    this.initializeServices();
  }

  private initializeServices() {
    const demoServices: InsertService[] = [
      {
        name: "Mobile Recharge",
        category: "recharge",
        icon: "smartphone",
        description: "Recharge your mobile phone"
      },
      {
        name: "Electricity Bill",
        category: "bill",
        icon: "lightbulb",
        description: "Pay your electricity bill"
      },
      {
        name: "Credit Card",
        category: "bill",
        icon: "credit-card",
        description: "Pay your credit card bill"
      },
      {
        name: "My Bills",
        category: "bill",
        icon: "file",
        description: "View and pay all your bills"
      },
      {
        name: "Personal Loan",
        category: "financial",
        icon: "briefcase",
        description: "Apply for a personal loan"
      },
      {
        name: "Credit Card Carnival",
        category: "financial",
        icon: "credit-card",
        description: "Exclusive credit card offers"
      },
      {
        name: "Paytm Money",
        category: "financial",
        icon: "wallet",
        description: "Invest in stocks, mutual funds & more"
      },
      {
        name: "SBI MF SIP",
        category: "financial",
        icon: "pie-chart",
        description: "Start SIP with just ₹250"
      }
    ];

    demoServices.forEach(service => {
      this.createService(service);
    });
  }

  // User methods
  async getUser(userId: number): Promise<any> {
    return this.users.get(userId);
  }

  async getUserByUsername(username: string): Promise<any> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(userData: any): Promise<any> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...userData, 
      id,
      balance: userData.balance || 0,
      profileImage: userData.profileImage || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: number, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    
    const updatedUser = { 
      ...user, 
      balance: (user.balance || 0) + amount 
    };
    
    this.users.set(userId, updatedUser);
  }

  // Service methods
  async getServices(): Promise<any[]> {
    return Array.from(this.services.values());
  }

  async getServicesByCategory(category: string): Promise<any[]> {
    return Array.from(this.services.values()).filter(
      (service) => service.category === category
    );
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = this.serviceIdCounter++;
    const service: Service = { 
      ...insertService, 
      id,
      description: insertService.description || null
    };
    this.services.set(id, service);
    return service;
  }

  // Transaction methods
  async createTransaction(transactionData: any): Promise<any> {
    const id = this.transactionIdCounter++;
    const transaction: Transaction = { 
      ...transactionData, 
      id,
      description: transactionData.description || null,
      authMethod: transactionData.authMethod || null,
      metadata: transactionData.metadata || null
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<any[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.userId === userId
    );
  }

  // UPI PIN methods
  async setUPIPin(userId: number, upiPin: string): Promise<boolean> {
    // Implementation needed
    return false;
  }

  async verifyUPIPin(userId: number, upiPin: string): Promise<boolean> {
    // Implementation needed
    return false;
  }
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize services if they don't exist
    this.initializeServices().catch(console.error);
  }

  private async initializeServices() {
    // Check if services exist
    const existingServices = await this.getServices();
    if (existingServices.length === 0) {
      console.log("Initializing services...");
      
      const demoServices: InsertService[] = [
        {
          name: "Mobile Recharge",
          category: "recharge",
          icon: "smartphone",
          description: "Recharge your mobile phone"
        },
        {
          name: "Electricity Bill",
          category: "bill",
          icon: "lightbulb",
          description: "Pay your electricity bill"
        },
        {
          name: "Credit Card",
          category: "bill",
          icon: "credit-card",
          description: "Pay your credit card bill"
        },
        {
          name: "My Bills",
          category: "bill",
          icon: "file",
          description: "View and pay all your bills"
        },
        {
          name: "Personal Loan",
          category: "financial",
          icon: "briefcase",
          description: "Apply for a personal loan"
        },
        {
          name: "Credit Card Carnival",
          category: "financial",
          icon: "credit-card",
          description: "Exclusive credit card offers"
        },
        {
          name: "Paytm Money",
          category: "financial",
          icon: "wallet",
          description: "Invest in stocks, mutual funds & more"
        },
        {
          name: "SBI MF SIP",
          category: "financial",
          icon: "pie-chart",
          description: "Start SIP with just ₹250"
        }
      ];

      for (const service of demoServices) {
        await this.createService(service);
      }
      
      console.log("Services initialized successfully!");
    }
  }
  async getUser(userId: number): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: any): Promise<any> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserBalance(userId: number, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    
    await db
      .update(users)
      .set({ balance: (user.balance || 0) + amount })
      .where(eq(users.id, userId));
    
    return;
  }

  async getServices(): Promise<any[]> {
    return db.select().from(services);
  }

  async getServicesByCategory(category: string): Promise<any[]> {
    return db.select().from(services).where(eq(services.category, category));
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(insertService)
      .returning();
    return service;
  }

  async createTransaction(transactionData: any): Promise<any> {
    const [transaction] = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<any[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
  }

  // UPI PIN methods
  async setUPIPin(userId: number, upiPin: string): Promise<boolean> {
    // Implementation needed
    return false;
  }

  async verifyUPIPin(userId: number, upiPin: string): Promise<boolean> {
    // Implementation needed
    return false;
  }
}

export class MongoDBStorage implements IStorage {
  private client: MongoClient;
  private db: any;

  constructor(uri: string) {
    this.client = new MongoClient(uri);
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db('paytm-clone');
  }

  async disconnect() {
    await this.client.close();
  }

  // User methods
  async getUser(userId: number) {
    return this.db.collection('users').findOne({ id: userId });
  }

  async getUserByUsername(username: string) {
    return this.db.collection('users').findOne({ username });
  }

  async createUser(userData: any) {
    const result = await this.db.collection('users').insertOne(userData);
    return { ...userData, _id: result.insertedId };
  }

  async updateUserBalance(userId: number, amount: number) {
    await this.db.collection('users').updateOne(
      { id: userId },
      { $inc: { balance: amount } }
    );
  }

  // Transaction methods
  async createTransaction(transactionData: any) {
    const result = await this.db.collection('transactions').insertOne(transactionData);
    return { ...transactionData, _id: result.insertedId };
  }

  async getUserTransactions(userId: number) {
    return this.db.collection('transactions')
      .find({ userId })
      .sort({ timestamp: -1 })
      .toArray();
  }

  // UPI PIN methods
  async setUPIPin(userId: number, upiPin: string): Promise<boolean> {
    try {
      // In a real app, hash the PIN before storing
      await this.db.collection('upi_pins').updateOne(
        { userId },
        { 
          $set: { 
            userId,
            pin: upiPin,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      return true;
    } catch (error) {
      console.error('Error setting UPI PIN:', error);
      return false;
    }
  }

  async verifyUPIPin(userId: number, upiPin: string): Promise<boolean> {
    try {
      // For demo purposes, accept any 4-digit PIN
      return /^\d{4}$/.test(upiPin);
      
      // In a real app, verify against stored (hashed) PIN:
      /*
      const storedPin = await this.db.collection('upi_pins').findOne({ userId });
      if (!storedPin) return false;
      return storedPin.pin === upiPin; // Use proper hash comparison in real app
      */
    } catch (error) {
      console.error('Error verifying UPI PIN:', error);
      return false;
    }
  }

  // Service methods
  async getServices() {
    return this.db.collection('services').find().toArray();
  }

  async getServicesByCategory(category: string) {
    return this.db.collection('services')
      .find({ category })
      .toArray();
  }
}

// Create and export the storage instance
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
export const storage = new MongoDBStorage(MONGODB_URI);
