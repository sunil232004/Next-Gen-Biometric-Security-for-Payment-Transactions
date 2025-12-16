# Authentication System Documentation

## Overview

This document describes the authentication system implemented for the Paytm Clone application. The system provides:

- User registration and login
- Session-based authentication with tokens
- Biometric authentication (fingerprint, face, voice)
- User-specific transactions
- UPI PIN management

## API Endpoints

### Authentication Routes (`/api/v2/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/signup` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/logout` | Logout current session | Yes |
| POST | `/logout-all` | Logout from all devices | Yes |
| GET | `/me` | Get current user info | Yes |
| PUT | `/profile` | Update profile | Yes |
| PUT | `/password` | Change password | Yes |
| POST | `/upi-pin` | Set UPI PIN | Yes |
| POST | `/verify-upi-pin` | Verify UPI PIN | Yes |
| DELETE | `/account` | Delete account | Yes |

### Biometric Routes (`/api/v2/biometric`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all biometrics | Yes |
| GET | `/:type` | Get specific biometric | Yes |
| POST | `/register` | Register biometric | Yes |
| POST | `/verify` | Verify biometric | Yes |
| PUT | `/:id/toggle` | Enable/disable biometric | Yes |
| PUT | `/:id/label` | Update biometric label | Yes |
| DELETE | `/:id` | Delete biometric | Yes |

### Transaction Routes (`/api/v2/transactions`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all transactions | Yes |
| GET | `/recent` | Get recent transactions | Yes |
| GET | `/stats` | Get transaction statistics | Yes |
| GET | `/search` | Search transactions | Yes |
| GET | `/:id` | Get single transaction | Yes |

### Payment Routes (`/api/v2/payments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/balance` | Get wallet balance | Yes |
| POST | `/upi` | Process UPI payment | Yes |
| POST | `/biometric` | Process biometric payment | Yes |
| POST | `/card` | Process card payment | Yes |
| POST | `/add-money` | Add money to wallet | Yes |
| POST | `/transfer` | Transfer to another user | Yes |
| POST | `/recharge` | Process recharge | Yes |

## Authentication Flow

### 1. Registration

```bash
POST /api/v2/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+919876543210"
}
```

Response:
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "upiId": "johndoe1234@paytm",
    "balance": 10000
  },
  "token": "..."
}
```

### 2. Login

```bash
POST /api/v2/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 3. Making Authenticated Requests

Include the token in the Authorization header:

```bash
GET /api/v2/auth/me
Authorization: Bearer <token>
```

## Biometric Authentication

### Supported Types

1. **Fingerprint** - Touch-based authentication
2. **Face** - Facial recognition
3. **Voice** - Voice pattern recognition

### Registering a Biometric

```bash
POST /api/v2/biometric/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "fingerprint",
  "data": "<encoded_biometric_data>",
  "label": "Right Thumb"
}
```

### Making Biometric Payments

```bash
POST /api/v2/payments/biometric
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientUpi": "merchant@upi",
  "amount": 100,
  "biometricType": "fingerprint",
  "biometricData": "<encoded_data>",
  "description": "Payment for coffee"
}
```

## Database Collections

### users
- `_id`: ObjectId
- `email`: string (unique)
- `password`: string (hashed)
- `name`: string
- `phone`: string (optional)
- `upiId`: string (auto-generated, unique)
- `upiPin`: string (hashed)
- `balance`: number
- `profileImage`: string (optional)
- `isVerified`: boolean
- `createdAt`: Date
- `updatedAt`: Date

### sessions
- `_id`: ObjectId
- `userId`: ObjectId
- `token`: string (unique)
- `deviceInfo`: string
- `ipAddress`: string
- `isActive`: boolean
- `expiresAt`: Date (TTL index)
- `createdAt`: Date
- `lastActivityAt`: Date

### transactions
- `_id`: ObjectId
- `userId`: ObjectId
- `type`: string (payment, transfer, recharge, etc.)
- `amount`: number
- `currency`: string
- `status`: string
- `description`: string
- `recipientId`: string
- `recipientName`: string
- `paymentMethod`: string
- `biometricType`: string (if biometric payment)
- `stripePaymentId`: string (if card payment)
- `metadata`: object
- `createdAt`: Date
- `updatedAt`: Date

### biometrics
- `_id`: ObjectId
- `userId`: ObjectId
- `type`: string (fingerprint, face, voice)
- `data`: string (encrypted)
- `label`: string
- `isActive`: boolean
- `lastUsed`: Date
- `createdAt`: Date
- `updatedAt`: Date

## Security Features

1. **Password Hashing**: Uses bcryptjs with 10 salt rounds
2. **Session Tokens**: 64-byte random hex strings
3. **Token Expiration**: 7 days by default
4. **Rate Limiting**: 5 signups/min, 10 logins/min per IP
5. **UPI PIN Hashing**: Separate hash for UPI PIN

## Frontend Integration

### AuthContext

The `AuthContext` provides:

```typescript
interface AuthContextType {
  user: User | null;
  biometrics: Biometric[];
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<Result>;
  signup: (data: SignupData) => Promise<Result>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<Result>;
  setUpiPin: (pin: string) => Promise<Result>;
  verifyUpiPin: (pin: string) => Promise<boolean>;
}
```

### Usage

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  
  return <div>Welcome, {user.name}!</div>;
}
```

## Database Cleanup

To clear all data and create fresh collections:

```bash
cd server
npx tsx scripts/cleanup-db.ts
```

**Note**: Ensure MONGODB_URI is properly configured.

## Legacy API Support

The legacy API (`/api/*`) is still available for backward compatibility. New features should use the v2 API (`/api/v2/*`).
