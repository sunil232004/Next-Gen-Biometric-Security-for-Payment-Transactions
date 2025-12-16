import {
  User,
  Service,
  Transaction,
  BiometricAuth,
  InsertUser,
  InsertService,
  InsertTransaction,
  InsertBiometricAuth
} from './schema';

// Interface for storage methods
export interface IStorage {
  // User methods
  getUser(userId: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<void>;
  
  // Transaction methods
  createTransaction(transactionData: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  // UPI PIN methods
  setUPIPin(userId: number, upiPin: string): Promise<boolean>;
  verifyUPIPin(userId: number, upiPin: string): Promise<boolean>;
  
  // Service methods
  getServices(): Promise<Service[]>;
  getServicesByCategory(category: string): Promise<Service[]>;
  createService(serviceData: InsertService): Promise<Service>;
  
  // Biometric methods
  createBiometricAuth(biometricData: InsertBiometricAuth): Promise<BiometricAuth>;
  verifyBiometricAuth(userId: number, type: string, data: string): Promise<boolean>;
  getUserBiometricAuth(userId: number): Promise<BiometricAuth[]>;
}
