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

interface GymData {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

class Gym extends Model<GymData> {
  static collectionName = 'gyms';
}

interface EquipmentData {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'maintenance' | 'broken';
  purchaseDate: Date;
}

interface GymStaffData {
  id: string;
  gymId: string;
  userId: string;
  role: 'manager' | 'trainer' | 'receptionist';
  status: 'active' | 'inactive';
}

class GymStaff extends Model<GymStaffData> {
  static collectionName = 'gyms_staff';
}

interface UserData {
  id: string;
  name: string;
  email: string;
  myGyms: string[];
}

class User extends Model<UserData> {
  static collectionName = 'users';
}

// ============================================
// SUBCOLLECTION EXAMPLES
// ============================================

async function subcollectionExamples() {
  console.log('=== Subcollection Examples ===');

  // Example 1: Access subcollection from loaded model
  const gym = await Gym.load('gym123');
  if (gym) {
    // Get all equipment
    const equipments = await gym.subcollection('equipments').get();
    console.log('All equipment:', equipments);

    // Query subcollection
    const activeEquipments = await gym
      .subcollection('equipments')
      .where('status', '==', 'active')
      .get();
    console.log('Active equipment:', activeEquipments);

    // Delete all broken equipment
    const deletedCount = await gym
      .subcollection('equipments')
      .where('status', '==', 'broken')
      .deleteAll();
    console.log(`Deleted ${deletedCount} broken equipment`);
  }

  // Example 2: Access subcollection statically
  const equipments = await Gym.subcollection('gym123', 'equipments').get();
  console.log('Equipment (static):', equipments);

  // Example 3: Listen to subcollection changes
  const unsubscribe = Gym.subcollection('gym123', 'equipments')
    .where('status', '==', 'active')
    .listen((equipments) => {
      console.log('Active equipment updated:', equipments);
    });

  // Stop listening after 5 seconds
  setTimeout(() => unsubscribe(), 5000);
}

// ============================================
// DELETE GYM WITH ALL RELATED DATA
// ============================================

async function deleteGymWithRelatedData(gymId: string) {
  console.log('=== Deleting Gym with Related Data ===');

  await Gym.transaction(async (ctx) => {
    // 1. Load gym
    const gym = await Gym.load(gymId);
    if (!gym) {
      throw new Error('Gym not found');
    }

    // 2. Delete all equipment (subcollection)
    const equipments = await gym.subcollection('equipments').get();
    console.log(`Deleting ${equipments.length} equipment items`);

    for (const equipment of equipments) {
      // In transaction, we need to load each one
      const equipmentModel = await Gym.subcollection(gymId, 'equipments').find(
        equipment.id
      );
      if (equipmentModel) {
        // Note: For subcollections, we'd need to create a model or use direct deletion
        // For now, we'll delete them outside the transaction
      }
    }

    // 3. Delete all gym staff and update users
    const staffMembers = await GymStaff.where('gymId', '==', gymId).get();
    console.log(`Processing ${staffMembers.length} staff members`);

    for (const staffData of staffMembers) {
      const staff = await GymStaff.load(staffData.id);
      const user = await User.load(staffData.userId);

      if (staff) {
        await ctx.delete(staff);
      }

      if (user) {
        const currentGyms = user.get('myGyms') || [];
        const updatedGyms = currentGyms.filter((id) => id !== gymId);
        await ctx.update(user, { myGyms: updatedGyms });
      }
    }

    // 4. Delete gym
    await ctx.delete(gym);
    console.log('Gym deleted successfully');
  });

  // Delete equipment subcollection outside transaction (batch operation)
  const deletedEquipment = await Gym.subcollection(
    gymId,
    'equipments'
  ).deleteAll();
  console.log(`Deleted ${deletedEquipment} equipment items`);
}

// ============================================
// BATCH DELETE EXAMPLE
// ============================================

async function batchDeleteExample() {
  console.log('=== Batch Delete Example ===');

  // Delete all inactive staff members
  const inactiveStaff = await GymStaff.where('status', '==', 'inactive').get();
  console.log(`Found ${inactiveStaff.length} inactive staff members`);

  await GymStaff.batch(async (ctx) => {
    for (const staffData of inactiveStaff) {
      const staff = await GymStaff.load(staffData.id);
      if (staff) {
        ctx.delete(staff);
      }
    }
  });

  console.log('Batch delete completed');
}

// ============================================
// ARRAY FIELD OPERATIONS
// ============================================

async function arrayFieldOperations(gymId: string) {
  console.log('=== Array Field Operations ===');

  // Remove gym from all users' myGyms array
  await User.transaction(async (ctx) => {
    const users = await User.where('myGyms', 'array-contains', gymId).get();
    console.log(`Updating ${users.length} users`);

    for (const userData of users) {
      const user = await User.load(userData.id);
      if (user) {
        const currentGyms = user.get('myGyms') || [];
        const updatedGyms = currentGyms.filter((id) => id !== gymId);
        await ctx.update(user, { myGyms: updatedGyms });
      }
    }
  });

  console.log('Array field operations completed');
}

// ============================================
// RUN EXAMPLES
// ============================================

async function runExamples() {
  try {
    await subcollectionExamples();
    await batchDeleteExample();

    // Uncomment to test deletion
    // await deleteGymWithRelatedData('gym123');
    // await arrayFieldOperations('gym123');
  } catch (error) {
    console.error('Error:', error);
  }
}

runExamples().catch(console.error);
