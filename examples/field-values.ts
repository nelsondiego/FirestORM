/**
 * Field Value Utilities Example
 *
 * This example demonstrates atomic field operations in Firestore:
 * - increment/decrement: Atomic numeric operations (prevents race conditions)
 * - arrayUnion: Add elements to arrays without duplicates
 * - arrayRemove: Remove elements from arrays
 * - deleteField: Remove fields from documents
 * - serverTimestamp: Set fields to server timestamp
 *
 * These operations are atomic and don't require reading the document first,
 * making them perfect for concurrent updates like credits, likes, or tags.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeOrm,
  Model,
  increment,
  arrayUnion,
  arrayRemove,
  deleteField,
  serverTimestamp,
} from '../src';

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
  loginCount: number;
  tags: string[];
  favoriteGyms: string[];
  lastLoginAt: Date;
  verifiedAt?: Date;
  temporaryToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

class User extends Model<UserData> {
  static collectionName = 'users';
}

interface ProductData {
  id: string;
  name: string;
  stock: number;
  views: number;
  likes: number;
  categories: string[];
  relatedProducts: string[];
  lastViewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

class Product extends Model<ProductData> {
  static collectionName = 'products';
}

// ============================================
// INCREMENT EXAMPLES
// ============================================

async function incrementExamples() {
  console.log('=== INCREMENT Examples ===\n');

  // Create a user
  const user = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    credits: 100,
    loginCount: 0,
    tags: [],
    favoriteGyms: [],
    lastLoginAt: new Date(),
  });

  console.log('Initial credits:', user.get('credits'));
  console.log('Initial loginCount:', user.get('loginCount'));

  // Increment credits by 50
  await User.update(user.id!, {
    credits: increment(50),
  });

  console.log('After increment(50): credits should be 150');

  // Increment login count by 1
  await User.update(user.id!, {
    loginCount: increment(1),
  });

  console.log('After increment(1): loginCount should be 1');

  // Decrement credits (negative increment)
  await User.update(user.id!, {
    credits: increment(-20),
  });

  console.log('After increment(-20): credits should be 130');

  // Multiple increments in one update
  await User.update(user.id!, {
    credits: increment(10),
    loginCount: increment(1),
  });

  console.log('After multiple increments:');
  console.log('- credits should be 140');
  console.log('- loginCount should be 2');

  // Verify final values
  const updatedUser = await User.find(user.id!);
  console.log('\nFinal values:');
  console.log('- credits:', updatedUser?.credits);
  console.log('- loginCount:', updatedUser?.loginCount);

  console.log('\n');
}

// ============================================
// ARRAY UNION EXAMPLES
// ============================================

async function arrayUnionExamples() {
  console.log('=== ARRAY UNION Examples ===\n');

  const user = await User.create({
    name: 'Jane Doe',
    email: 'jane@example.com',
    credits: 0,
    loginCount: 0,
    tags: ['user'],
    favoriteGyms: [],
    lastLoginAt: new Date(),
  });

  console.log('Initial tags:', user.get('tags'));

  // Add single tag
  await User.update(user.id!, {
    tags: arrayUnion('premium'),
  });

  console.log('After arrayUnion("premium"): tags should include "premium"');

  // Add multiple tags
  await User.update(user.id!, {
    tags: arrayUnion('verified', 'active'),
  });

  console.log(
    'After arrayUnion("verified", "active"): tags should include both'
  );

  // Add duplicate (won't be added again)
  await User.update(user.id!, {
    tags: arrayUnion('premium'), // Already exists, won't duplicate
  });

  console.log('After adding duplicate: tags should not have duplicate');

  // Add to multiple arrays
  await User.update(user.id!, {
    tags: arrayUnion('vip'),
    favoriteGyms: arrayUnion('gym1', 'gym2', 'gym3'),
  });

  // Verify final values
  const updatedUser = await User.find(user.id!);
  console.log('\nFinal values:');
  console.log('- tags:', updatedUser?.tags);
  console.log('- favoriteGyms:', updatedUser?.favoriteGyms);

  console.log('\n');
}

// ============================================
// ARRAY REMOVE EXAMPLES
// ============================================

async function arrayRemoveExamples() {
  console.log('=== ARRAY REMOVE Examples ===\n');

  const user = await User.create({
    name: 'Bob Smith',
    email: 'bob@example.com',
    credits: 0,
    loginCount: 0,
    tags: ['user', 'trial', 'pending', 'active'],
    favoriteGyms: ['gym1', 'gym2', 'gym3', 'gym4'],
    lastLoginAt: new Date(),
  });

  console.log('Initial tags:', user.get('tags'));
  console.log('Initial favoriteGyms:', user.get('favoriteGyms'));

  // Remove single tag
  await User.update(user.id!, {
    tags: arrayRemove('trial'),
  });

  console.log('After arrayRemove("trial"): "trial" should be removed');

  // Remove multiple tags
  await User.update(user.id!, {
    tags: arrayRemove('pending', 'active'),
  });

  console.log('After arrayRemove("pending", "active"): both should be removed');

  // Remove from multiple arrays
  await User.update(user.id!, {
    tags: arrayRemove('user'),
    favoriteGyms: arrayRemove('gym2', 'gym4'),
  });

  // Verify final values
  const updatedUser = await User.find(user.id!);
  console.log('\nFinal values:');
  console.log('- tags:', updatedUser?.tags);
  console.log('- favoriteGyms:', updatedUser?.favoriteGyms);

  console.log('\n');
}

// ============================================
// DELETE FIELD EXAMPLES
// ============================================

async function deleteFieldExamples() {
  console.log('=== DELETE FIELD Examples ===\n');

  const user = await User.create({
    name: 'Alice Johnson',
    email: 'alice@example.com',
    credits: 100,
    loginCount: 5,
    tags: ['user'],
    favoriteGyms: [],
    lastLoginAt: new Date(),
    temporaryToken: 'temp-token-123',
  });

  console.log('Initial temporaryToken:', user.get('temporaryToken'));

  // Delete a field
  await User.update(user.id!, {
    temporaryToken: deleteField(),
  });

  console.log('After deleteField(): temporaryToken should be removed');

  // Verify field is deleted
  const updatedUser = await User.find(user.id!);
  console.log('\nFinal value:');
  console.log('- temporaryToken:', updatedUser?.temporaryToken); // Should be undefined

  console.log('\n');
}

// ============================================
// SERVER TIMESTAMP EXAMPLES
// ============================================

async function serverTimestampExamples() {
  console.log('=== SERVER TIMESTAMP Examples ===\n');

  const user = await User.create({
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    credits: 0,
    loginCount: 0,
    tags: [],
    favoriteGyms: [],
    lastLoginAt: new Date('2020-01-01'), // Old date
  });

  console.log('Initial lastLoginAt:', user.get('lastLoginAt'));

  // Update with server timestamp
  await User.update(user.id!, {
    lastLoginAt: serverTimestamp(),
  });

  console.log('After serverTimestamp(): lastLoginAt should be current time');

  // Add verified timestamp
  await User.update(user.id!, {
    verifiedAt: serverTimestamp(),
  });

  console.log('After adding verifiedAt: field should have current timestamp');

  // Verify timestamps
  const updatedUser = await User.find(user.id!);
  console.log('\nFinal values:');
  console.log('- lastLoginAt:', updatedUser?.lastLoginAt);
  console.log('- verifiedAt:', updatedUser?.verifiedAt);

  console.log('\n');
}

// ============================================
// COMBINED OPERATIONS
// ============================================

async function combinedOperations() {
  console.log('=== COMBINED Operations ===\n');

  const user = await User.create({
    name: 'David Wilson',
    email: 'david@example.com',
    credits: 50,
    loginCount: 10,
    tags: ['user', 'trial'],
    favoriteGyms: ['gym1'],
    lastLoginAt: new Date('2020-01-01'),
  });

  console.log('Initial state:');
  console.log('- credits:', user.get('credits'));
  console.log('- loginCount:', user.get('loginCount'));
  console.log('- tags:', user.get('tags'));
  console.log('- favoriteGyms:', user.get('favoriteGyms'));

  // Combine multiple field value operations
  await User.update(user.id!, {
    credits: increment(100), // Add 100 credits
    loginCount: increment(1), // Increment login count
    tags: arrayUnion('premium', 'verified'), // Add tags
    favoriteGyms: arrayUnion('gym2', 'gym3'), // Add gyms
    lastLoginAt: serverTimestamp(), // Update timestamp
  });

  console.log('\nAfter combined operations:');

  const updatedUser = await User.find(user.id!);
  console.log('- credits:', updatedUser?.credits); // Should be 150
  console.log('- loginCount:', updatedUser?.loginCount); // Should be 11
  console.log('- tags:', updatedUser?.tags); // Should include premium, verified
  console.log('- favoriteGyms:', updatedUser?.favoriteGyms); // Should include gym2, gym3
  console.log('- lastLoginAt:', updatedUser?.lastLoginAt); // Should be current time

  console.log('\n');
}

// ============================================
// PRODUCT EXAMPLE (E-commerce)
// ============================================

async function productExample() {
  console.log('=== PRODUCT Example (E-commerce) ===\n');

  const product = await Product.create({
    name: 'Wireless Headphones',
    stock: 100,
    views: 0,
    likes: 0,
    categories: ['electronics'],
    relatedProducts: [],
    lastViewedAt: new Date(),
  });

  console.log('Initial product:');
  console.log('- stock:', product.get('stock'));
  console.log('- views:', product.get('views'));
  console.log('- likes:', product.get('likes'));

  // User views product
  await Product.update(product.id!, {
    views: increment(1),
    lastViewedAt: serverTimestamp(),
  });

  console.log('\nAfter user views product:');
  console.log('- views incremented by 1');
  console.log('- lastViewedAt updated');

  // User likes product
  await Product.update(product.id!, {
    likes: increment(1),
  });

  console.log('\nAfter user likes product:');
  console.log('- likes incremented by 1');

  // Add categories and related products
  await Product.update(product.id!, {
    categories: arrayUnion('audio', 'wireless'),
    relatedProducts: arrayUnion('prod1', 'prod2', 'prod3'),
  });

  console.log('\nAfter adding categories and related products:');

  // Product sold (decrease stock)
  await Product.update(product.id!, {
    stock: increment(-5), // Sold 5 units
  });

  console.log('\nAfter selling 5 units:');
  console.log('- stock decreased by 5');

  // Verify final state
  const updatedProduct = await Product.find(product.id!);
  console.log('\nFinal product state:');
  console.log('- stock:', updatedProduct?.stock); // Should be 95
  console.log('- views:', updatedProduct?.views); // Should be 1
  console.log('- likes:', updatedProduct?.likes); // Should be 1
  console.log('- categories:', updatedProduct?.categories);
  console.log('- relatedProducts:', updatedProduct?.relatedProducts);

  console.log('\n');
}

// ============================================
// SUBCOLLECTION EXAMPLE
// ============================================

async function subcollectionExample() {
  console.log('=== SUBCOLLECTION with Field Values ===\n');

  interface GymData {
    id: string;
    name: string;
    memberCount: number;
    createdAt: Date;
    updatedAt: Date;
  }

  class Gym extends Model<GymData> {
    static collectionName = 'gyms';
  }

  const gym = await Gym.create({
    name: 'PowerFit Gym',
    memberCount: 0,
  });

  console.log('Initial memberCount:', gym.get('memberCount'));

  // Add equipment with field values
  await gym.subcollection('equipments').create({
    name: 'Treadmill',
    quantity: 5,
    views: 0,
  });

  // Update equipment with increment
  const equipments = await gym.subcollection('equipments').get();
  if (equipments.length > 0) {
    await gym.subcollection('equipments').update(equipments[0].id, {
      views: increment(1),
      quantity: increment(-1), // One used
    });

    console.log('Updated equipment with field values');
  }

  // Update gym member count
  await Gym.update(gym.id!, {
    memberCount: increment(1),
  });

  console.log('Incremented gym memberCount');

  const updatedGym = await Gym.find(gym.id!);
  console.log('Final memberCount:', updatedGym?.memberCount);

  console.log('\n');
}

// Run all examples
async function main() {
  try {
    await incrementExamples();
    await arrayUnionExamples();
    await arrayRemoveExamples();
    await deleteFieldExamples();
    await serverTimestampExamples();
    await combinedOperations();
    await productExample();
    await subcollectionExample();

    console.log('✅ All field value examples completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
