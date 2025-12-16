import { ObjectId } from 'mongodb';
import { getDb } from '../mongodb.js';

export interface IBiometric {
  _id?: ObjectId;
  userId: ObjectId;
  type: 'fingerprint' | 'face' | 'voice';
  data: string; // Encrypted biometric data/template
  label?: string; // e.g., "Right thumb", "Face ID"
  isActive: boolean;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBiometricPublic {
  _id: string;
  userId: string;
  type: string;
  label?: string;
  isActive: boolean;
  lastUsed?: Date;
  createdAt: Date;
}

export const BIOMETRICS_COLLECTION = 'biometrics';

export class BiometricModel {
  private static get collection() {
    return getDb().collection<IBiometric>(BIOMETRICS_COLLECTION);
  }

  // Create biometric
  static async create(data: {
    userId: ObjectId | string;
    type: IBiometric['type'];
    data: string;
    label?: string;
  }): Promise<IBiometric> {
    const userObjectId = typeof data.userId === 'string' ? new ObjectId(data.userId) : data.userId;
    
    // Check if user already has this type of biometric
    const existing = await this.findByUserAndType(userObjectId, data.type);
    if (existing) {
      throw new Error(`${data.type} biometric already registered`);
    }

    const biometric: IBiometric = {
      userId: userObjectId,
      type: data.type,
      data: data.data,
      label: data.label,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(biometric);
    biometric._id = result.insertedId;
    return biometric;
  }

  // Find by ID
  static async findById(id: string | ObjectId): Promise<IBiometric | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return this.collection.findOne({ _id: objectId });
  }

  // Find by user ID
  static async findByUserId(userId: string | ObjectId): Promise<IBiometric[]> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return this.collection.find({ userId: objectId }).toArray();
  }

  // Find by user and type
  static async findByUserAndType(userId: string | ObjectId, type: string): Promise<IBiometric | null> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return this.collection.findOne({ userId: objectId, type: type as IBiometric['type'] });
  }

  // Get active biometrics for user
  static async getActiveBiometrics(userId: string | ObjectId): Promise<IBiometric[]> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return this.collection.find({ userId: objectId, isActive: true }).toArray();
  }

  // Update biometric
  static async update(id: string | ObjectId, data: Partial<IBiometric>): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    data.updatedAt = new Date();
    
    const result = await this.collection.updateOne(
      { _id: objectId },
      { $set: data }
    );
    return result.modifiedCount > 0;
  }

  // Toggle active status
  static async toggleActive(id: string | ObjectId): Promise<boolean> {
    const biometric = await this.findById(id);
    if (!biometric) return false;
    
    return this.update(id, { isActive: !biometric.isActive });
  }

  // Update last used
  static async updateLastUsed(id: string | ObjectId): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await this.collection.updateOne(
      { _id: objectId },
      { 
        $set: { 
          lastUsed: new Date(),
          updatedAt: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  }

  // Verify biometric (simplified - in production would use ML matching)
  static async verify(userId: string | ObjectId, type: string, data: string): Promise<{
    success: boolean;
    biometricId?: string;
    message: string;
  }> {
    const biometric = await this.findByUserAndType(userId, type);
    
    if (!biometric) {
      return { success: false, message: `No ${type} biometric registered` };
    }

    if (!biometric.isActive) {
      return { success: false, message: `${type} biometric is disabled` };
    }

    // In production, this would use proper biometric matching algorithms
    // For demo, we accept any data if biometric is registered
    // You could implement similarity checking here
    
    // Update last used
    await this.updateLastUsed(biometric._id!);
    
    return { 
      success: true, 
      biometricId: biometric._id!.toString(),
      message: 'Biometric verified successfully'
    };
  }

  // Delete biometric
  static async delete(id: string | ObjectId): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await this.collection.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }

  // Delete all by user
  static async deleteByUserId(userId: string | ObjectId): Promise<void> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    await this.collection.deleteMany({ userId: objectId });
  }

  // Convert to public (without sensitive data)
  static toPublic(biometric: IBiometric): IBiometricPublic {
    return {
      _id: biometric._id!.toString(),
      userId: biometric.userId.toString(),
      type: biometric.type,
      label: biometric.label,
      isActive: biometric.isActive,
      lastUsed: biometric.lastUsed,
      createdAt: biometric.createdAt,
    };
  }

  // Delete all biometrics (for cleanup)
  static async deleteAll(): Promise<void> {
    await this.collection.deleteMany({});
  }
}
