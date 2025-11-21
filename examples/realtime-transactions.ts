import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeOrm, Model } from '../src';

// Initialize Firebase
const app = initializeApp({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
});

const firestore = getFirestore(app);
initializeOrm(firestore);

// ============================================
// DEFINE MODELS
// ============================================

interface UserData {
  id: string;
  name: string;
  email: string;
  credits: number;
  status: 'active' | 'inactive';
  gymId?: string;
  createdAt: Date;
  updatedAt: Date;
}

class User extends Model<UserData> {
  static collectionName = 'users';
}

interface GymData {
  id: string;
  name: string;
  memberCount: number;
  maxMembers: number;
  membershipFee: number;
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

class Gym extends Model<GymData> {
  static collectionName = 'gyms';
}

interface OrderData {
  id: string;
  userId: string;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
}

class Order extends Model<OrderData> {
  static collectionName = 'orders';
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

async function realtimeExamples() {
  console.log('=== Real-time Subscriptions ===');

  // Basic listen (receives JSON)
  const unsubscribe = User.listen('user123', (user) => {
    if (user) {
      console.log('User updated:', user); // Already JSON!
      console.log('Name:', user.name);
    } else {
      console.log('User not found or deleted');
    }
  });

  // Simulate some time passing
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Stop listening
  unsubscribe();
  console.log('Stopped listening');
}

// ============================================
// TRANSACTIONS - NO FIRESTORE CODE!
// ============================================

async function transactionExamples() {
  console.log('=== Transactions ===');

  // Example 1: Transfer credits between users
  try {
    await User.transaction(async (ctx) => {
      // Load both users
      const user1 = await User.load('user1');
      const user2 = await User.load('user2');

      if (!user1 || !user2) {
        throw new Error('Users not found');
      }

      // Check balance
      const user1Credits = user1.get('credits') ?? 0;
      if (user1Credits < 100) {
        throw new Error('Insufficient credits');
      }

      // Transfer credits atomically
      const user2Credits = user2.get('credits') ?? 0;
      await ctx.update(user1, { credits: user1Credits - 100 });
      await ctx.update(user2, { credits: user2Credits + 100 });
    });

    console.log('Transaction completed successfully');
  } catch (error) {
    console.error('Transaction failed:', error);
  }

  // Example 2: Transaction across multiple models (User + Gym)
  try {
    await User.transaction(async (ctx) => {
      // Load both models
      const user = await User.load('user123');
      const gym = await Gym.load('gym456');

      if (!user || !gym) {
        throw new Error('User or Gym not found');
      }

      // Validate
      const memberCount = gym.get('memberCount') ?? 0;
      const maxMembers = gym.get('maxMembers') ?? 0;
      const userCredits = user.get('credits') ?? 0;
      const membershipFee = gym.get('membershipFee') ?? 0;

      if (memberCount >= maxMembers) {
        throw new Error('Gym is full');
      }

      if (userCredits < membershipFee) {
        throw new Error('Insufficient credits');
      }

      // Update both atomically - if one fails, both rollback
      await ctx.update(user, {
        credits: userCredits - membershipFee,
        gymId: gym.id,
      });

      await ctx.update(gym, {
        memberCount: memberCount + 1,
        memberIds: [...(gym.get('memberIds') || []), user.id!],
      });
    });

    console.log('User joined gym successfully (atomic operation)');
  } catch (error) {
    console.error('Join gym failed, all changes rolled back:', error);
  }

  // Example 3: Transaction with create and delete
  await User.transaction(async (ctx) => {
    // Create a new user
    const newUser = await ctx.create(User, {
      name: 'New User',
      email: 'new@example.com',
      credits: 0,
      status: 'active',
    });

    console.log('Created user:', newUser.id);

    // Load and delete old user
    const oldUser = await User.load('old-user-id');
    if (oldUser) {
      await ctx.delete(oldUser);
      console.log('Deleted old user');
    }
  });

  // Example 4: Transaction with return value
  const result = await User.transaction<{ success: boolean; balance: number }>(
    async (ctx) => {
      const user = await User.load('user1');
      if (!user) {
        throw new Error('User not found');
      }

      const currentCredits = user.get('credits') ?? 0;
      const newBalance = currentCredits + 50;

      await ctx.update(user, { credits: newBalance });

      return {
        success: true,
        balance: newBalance,
      };
    }
  );

  console.log('Transaction result:', result);
}

// ============================================
// BATCH OPERATIONS - NO FIRESTORE CODE!
// ============================================

async function batchExamples() {
  console.log('=== Batch Operations ===');

  // Update multiple users
  await User.batch(async (ctx) => {
    const user1 = await User.load('user1');
    const user2 = await User.load('user2');
    const user3 = await User.load('user3');

    if (user1) ctx.update(user1, { status: 'active' });
    if (user2) ctx.update(user2, { status: 'active' });
    if (user3) ctx.update(user3, { status: 'active' });
  });

  console.log('Batch update completed');

  // Create multiple users
  await User.batch(async (ctx) => {
    ctx.create(User, {
      name: 'John',
      email: 'john@example.com',
      credits: 100,
      status: 'active',
    });
    ctx.create(User, {
      name: 'Jane',
      email: 'jane@example.com',
      credits: 100,
      status: 'active',
    });
    ctx.create(User, {
      name: 'Bob',
      email: 'bob@example.com',
      credits: 100,
      status: 'active',
    });
  });

  console.log('Batch create completed');

  // Delete inactive users
  const inactiveUsers = await User.where('status', '==', 'inactive').get();

  await User.batch(async (ctx) => {
    for (const userData of inactiveUsers) {
      const user = await User.load(userData.id);
      if (user) {
        ctx.delete(user);
      }
    }
  });

  console.log(`Deleted ${inactiveUsers.length} inactive users`);
}

// ============================================
// CUSTOM IDs
// ============================================

async function customIdExamples() {
  console.log('=== Custom IDs ===');

  // Create with custom ID
  const user1 = await User.create(
    {
      name: 'John Doe',
      email: 'john@example.com',
      credits: 100,
      status: 'active',
    },
    'my-custom-id'
  );

  console.log('User created with custom ID:', user1.id);

  // Create with ID in data
  const user2 = await User.create({
    id: 'another-custom-id',
    name: 'Jane Doe',
    email: 'jane@example.com',
    credits: 100,
    status: 'active',
  });

  console.log('User created with ID in data:', user2.id);

  // Custom ID in transaction
  await User.transaction(async (ctx) => {
    const user = await ctx.create(
      User,
      { name: 'Bob', email: 'bob@example.com', credits: 100, status: 'active' },
      'bob-custom-id'
    );

    console.log('Created user in transaction with custom ID:', user.id);
  });
}

// ============================================
// COMPLETE EXAMPLE: Order Processing
// ============================================

async function processOrder(orderId: string, userId: string) {
  return Order.transaction(async (ctx) => {
    // Load order and user
    const order = await Order.load(orderId);
    const user = await User.load(userId);

    if (!order || !user) {
      throw new Error('Order or user not found');
    }

    const userCredits = user.get('credits') ?? 0;
    const orderTotal = order.get('total') ?? 0;

    // Check if user has enough credits
    if (userCredits < orderTotal) {
      throw new Error('Insufficient credits');
    }

    // Update order status
    await ctx.update(order, {
      status: 'processing',
      processedAt: new Date(),
    });

    // Deduct credits from user
    const remainingCredits = userCredits - orderTotal;
    await ctx.update(user, {
      credits: remainingCredits,
    });

    return {
      success: true,
      remainingCredits,
    };
  });
}

// ============================================
// RUN EXAMPLES
// ============================================

async function runExamples() {
  try {
    await realtimeExamples();
    await transactionExamples();
    await batchExamples();
    await customIdExamples();

    // Process an order
    const result = await processOrder('order123', 'user1');
    console.log('Order processed:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

runExamples().catch(console.error);
