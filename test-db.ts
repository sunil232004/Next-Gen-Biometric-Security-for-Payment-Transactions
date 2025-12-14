import { storage } from "./server/storage";

async function test() {
  const newUser = {
    username: 'testuser',
    password: 'password123',
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    balance: 1000
  };

  try {
    console.log('Creating test user...');
    const user = await storage.createUser(newUser);
    console.log('User created:', user);

    console.log('Getting services...');
    const services = await storage.getServices();
    console.log(`Found ${services.length} services`);
  } catch (e) {
    console.error('Error:', e);
  }
}

test();