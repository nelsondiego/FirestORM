/**
 * Batch Operations by ID Example
 *
 * This example demonstrates cost-optimized batch operations:
 * - Update documents by ID without loading them first (saves read operations)
 * - Delete documents by ID in batch (50% cost reduction)
 * - Mixed batch operations (create, update, delete)
 * - Transaction operations by ID
 * - Bulk updates with proper batching (500 docs per batch)
 *
 * Key benefit: Reduces Firestore operations by 50% when updating/deleting multiple documents.
 */

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

// Define model
interface UserData {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

class User extends Model<UserData> {
  static collectionName = 'users';
}

// ============================================
// BATCH OPERATIONS BY ID
// ============================================

async function batchUpdateByIdExample() {
  console.log('=== Batch Update by ID ===');

  const userIds = ['user1', 'user2', 'user3', 'user4', 'user5'];

  // ❌ Old way: Load each user first (2 operations per user)
  await User.batch(async (ctx) => {
    for (const id of userIds) {
      const user = await User.load(id); // 1 read operation
      if (user) {
        ctx.update(user, { status: 'active' }); // 1 write operation
      }
    }
  });
  // Total: 10 operations (5 reads + 5 writes)

  // ✅ New way: Update by ID (1 operation per user)
  await User.batch(async (ctx) => {
    for (const id of userIds) {
      ctx.update(User, id, { status: 'active' }); // 1 write operation only
    }
  });
  // Total: 5 operations (5 writes)
  // Saves 5 read operations! 💰

  console.log('Batch update completed');
}

async function batchDeleteByIdExample() {
  console.log('=== Batch Delete by ID ===');

  const userIds = ['user1', 'user2', 'user3'];

  // ❌ Old way: Load each user first
  await User.batch(async (ctx) => {
    for (const id of userIds) {
      const user = await User.load(id); // 1 read operation
      if (user) {
        ctx.delete(user); // 1 delete operation
      }
    }
  });
  // Total: 6 operations (3 reads + 3 deletes)

  // ✅ New way: Delete by ID
  await User.batch(async (ctx) => {
    for (const id of userIds) {
      ctx.delete(User, id); // 1 delete operation only
    }
  });
  // Total: 3 operations (3 deletes)
  // Saves 3 read operations! 💰

  console.log('Batch delete completed');
}

async function mixedBatchOperations() {
  console.log('=== Mixed Batch Operations ===');

  await User.batch(async (ctx) => {
    // Create new users
    ctx.create(User, {
      name: 'John Doe',
      email: 'john@example.com',
      status: 'active',
      credits: 100,
    });

    ctx.create(User, {
      name: 'Jane Doe',
      email: 'jane@example.com',
      status: 'active',
      credits: 100,
    });

    // Update existing users by ID (no loading needed)
    ctx.update(User, 'user1', { credits: 200 });
    ctx.update(User, 'user2', { status: 'inactive' });

    // Delete users by ID (no loading needed)
    ctx.delete(User, 'user3');
    ctx.delete(User, 'user4');
  });

  console.log('Mixed batch operations completed');
}

// ============================================
// TRANSACTION OPERATIONS BY ID
// ============================================

async function transactionUpdateByIdExample() {
  console.log('=== Transaction Update by ID ===');

  await User.transaction(async (ctx) => {
    // Update multiple users atomically by ID
    await ctx.update(User, 'user1', { credits: 150 });
    await ctx.update(User, 'user2', { credits: 250 });
    await ctx.update(User, 'user3', { status: 'active' });
  });

  console.log('Transaction update completed');
}

async function transactionTransferCredits() {
  console.log('=== Transaction Transfer Credits ===');

  await User.transaction(async (ctx) => {
    // Load users to check balances
    const fromUser = await User.load('user1');
    const toUser = await User.load('user2');

    if (!fromUser || !toUser) {
      throw new Error('Users not found');
    }

    const amount = 50;
    const fromCredits = fromUser.get('credits');
    const toCredits = toUser.get('credits');

    if (fromCredits === undefined || toCredits === undefined) {
      throw new Error('Credits not found');
    }

    if (fromCredits < amount) {
      throw new Error('Insufficient credits');
    }

    // Update by ID (more efficient)
    await ctx.update(User, fromUser.id!, {
      credits: fromCredits - amount,
    });

    await ctx.update(User, toUser.id!, {
      credits: toCredits + amount,
    });
  });

  console.log('Credits transferred successfully');
}

// ============================================
// BULK OPERATIONS WITH COST OPTIMIZATION
// ============================================

async function bulkUpdateOptimized() {
  console.log('=== Bulk Update Optimized ===');

  // Get users to update
  const inactiveUsers = await User.where('status', '==', 'inactive').get();

  const BATCH_SIZE = 500;

  for (let i = 0; i < inactiveUsers.length; i += BATCH_SIZE) {
    const batchUsers = inactiveUsers.slice(i, i + BATCH_SIZE);

    await User.batch(async (ctx) => {
      for (const userData of batchUsers) {
        // Update by ID - saves read operations
        ctx.update(User, userData.id, { status: 'active' });
      }
    });
  }

  console.log(`Updated ${inactiveUsers.length} users`);
}

// Run examples
async function main() {
  try {
    await batchUpdateByIdExample();
    await batchDeleteByIdExample();
    await mixedBatchOperations();
    await transactionUpdateByIdExample();
    await transactionTransferCredits();
    await bulkUpdateOptimized();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
