import { ObjectId } from 'mongodb';
import { getDb } from '../mongodb.js';
import crypto from 'crypto';

export interface ISession {
  _id?: ObjectId;
  userId: ObjectId;
  token: string;
  deviceInfo?: string;
  ipAddress?: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
}

export const SESSIONS_COLLECTION = 'sessions';

export class SessionModel {
  private static get collection() {
    return getDb().collection<ISession>(SESSIONS_COLLECTION);
  }

  // Generate secure token
  static generateToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  // Create session
  static async create(data: {
    userId: ObjectId | string;
    deviceInfo?: string;
    ipAddress?: string;
    expiresInDays?: number;
  }): Promise<ISession> {
    const userObjectId = typeof data.userId === 'string' ? new ObjectId(data.userId) : data.userId;
    const expiresInDays = data.expiresInDays || 7;
    
    const session: ISession = {
      userId: userObjectId,
      token: this.generateToken(),
      deviceInfo: data.deviceInfo,
      ipAddress: data.ipAddress,
      isActive: true,
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    const result = await this.collection.insertOne(session);
    session._id = result.insertedId;
    return session;
  }

  // Find by token
  static async findByToken(token: string): Promise<ISession | null> {
    return this.collection.findOne({ 
      token, 
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
  }

  // Find by user ID
  static async findByUserId(userId: string | ObjectId): Promise<ISession[]> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return this.collection.find({ 
      userId: objectId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).toArray();
  }

  // Update last activity
  static async updateLastActivity(token: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { token },
      { $set: { lastActivityAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  // Invalidate session (logout)
  static async invalidate(token: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { token },
      { $set: { isActive: false } }
    );
    return result.modifiedCount > 0;
  }

  // Invalidate all sessions for user (logout everywhere)
  static async invalidateAllForUser(userId: string | ObjectId): Promise<void> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    await this.collection.updateMany(
      { userId: objectId },
      { $set: { isActive: false } }
    );
  }

  // Clean up expired sessions
  static async cleanupExpired(): Promise<number> {
    const result = await this.collection.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    return result.deletedCount;
  }

  // Delete all sessions (for cleanup)
  static async deleteAll(): Promise<void> {
    await this.collection.deleteMany({});
  }
}
