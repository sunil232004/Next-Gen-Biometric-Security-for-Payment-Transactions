import { ObjectId } from 'mongodb';
import { getDb } from '../mongodb.js';
import bcrypt from 'bcryptjs';

export interface IUser {
  _id?: ObjectId;
  accountId: string; // Unique account identifier
  email: string;
  password: string;
  name: string;
  phone?: string;
  upiId: string;
  upiPin?: string;
  balance: number;
  profileImage?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPublic {
  _id: string;
  accountId: string;
  email: string;
  name: string;
  phone?: string;
  upiId: string;
  balance: number;
  profileImage?: string;
  isVerified: boolean;
  createdAt: Date;
}

export const USERS_COLLECTION = 'users';

export class UserModel {
  private static get collection() {
    return getDb().collection<IUser>(USERS_COLLECTION);
  }

  // Generate unique Account ID (format: ACC-XXXXXXXX)
  static generateAccountId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ACC-${timestamp}${random}`;
  }

  // Generate unique UPI ID
  static generateUpiId(name: string): string {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const random = Math.floor(Math.random() * 10000);
    return `${cleanName}${random}@paytm`;
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Compare password
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Hash UPI PIN
  static async hashUpiPin(pin: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(pin, salt);
  }

  // Compare UPI PIN
  static async compareUpiPin(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
  }

  // Create user
  static async create(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<IUser> {
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await this.hashPassword(data.password);
    const upiId = this.generateUpiId(data.name);
    const accountId = this.generateAccountId();

    const user: IUser = {
      accountId,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      name: data.name,
      phone: data.phone,
      upiId,
      balance: 10000, // Starting balance for demo
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(user);
    user._id = result.insertedId;
    return user;
  }

  // Find by ID
  static async findById(id: string | ObjectId): Promise<IUser | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return this.collection.findOne({ _id: objectId });
  }

  // Find by email
  static async findByEmail(email: string): Promise<IUser | null> {
    return this.collection.findOne({ email: email.toLowerCase() });
  }

  // Find by UPI ID
  static async findByUpiId(upiId: string): Promise<IUser | null> {
    return this.collection.findOne({ upiId });
  }

  // Find by phone
  static async findByPhone(phone: string): Promise<IUser | null> {
    return this.collection.findOne({ phone });
  }

  // Update user
  static async update(id: string | ObjectId, data: Partial<IUser>): Promise<IUser | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    data.updatedAt = new Date();
    
    await this.collection.updateOne(
      { _id: objectId },
      { $set: data }
    );
    
    return this.findById(objectId);
  }

  // Update balance
  static async updateBalance(id: string | ObjectId, amount: number): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await this.collection.updateOne(
      { _id: objectId },
      { 
        $inc: { balance: amount },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  // Set UPI PIN
  static async setUpiPin(id: string | ObjectId, pin: string): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const hashedPin = await this.hashUpiPin(pin);
    
    const result = await this.collection.updateOne(
      { _id: objectId },
      { 
        $set: { 
          upiPin: hashedPin,
          updatedAt: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  }

  // Verify UPI PIN
  static async verifyUpiPin(id: string | ObjectId, pin: string): Promise<boolean> {
    const user = await this.findById(id);
    if (!user || !user.upiPin) return false;
    return this.compareUpiPin(pin, user.upiPin);
  }

  // Convert to public user (without sensitive data)
  static toPublic(user: IUser): IUserPublic {
    return {
      _id: user._id!.toString(),
      accountId: user.accountId,
      email: user.email,
      name: user.name,
      phone: user.phone,
      upiId: user.upiId,
      balance: user.balance,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }

  // Delete all users (for cleanup)
  static async deleteAll(): Promise<void> {
    await this.collection.deleteMany({});
  }
}
