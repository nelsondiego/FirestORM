/**
 * Atomic Cascade Delete Example
 *
 * Demonstrates how to delete documents with subcollections and related data
 * atomically using transactions.
 */

import { Model, ModelAttributes } from '../src';

// ============================================
// MODEL DEFINITIONS
// ============================================

interface GymData extends ModelAttributes {
  name: string;
  address: string;
  memberCount: number;
  maxMembers: number;
  status: 'active' | 'inactive';
}

interface EquipmentData extends ModelAttributes {
  name: string;
  type: string;
  status: 'active' | 'broken' | 'maintenance';
  purchaseDate: Date;
}

interface MemberData extends ModelAttributes {
  userId: string;
  membershipType: 'basic' | 'premium';
  joinedAt: Date;
}

interface GymStaffData extends ModelAttributes {
  gymId: string;
  name: string;
  role: 'trainer' | 'manager' | 'receptionist';
  email: string;
}

interface UserData extends ModelAttributes {
  name: string;
  email: string;
  myGyms: string[];
  credits: number;
}

class Gym extends Model<GymData> {
  static collectionName = 'gyms';
}

class GymStaff extends Model<GymStaffData> {
  static collectionName = 'gyms_staff';
}

class User extends Model<UserData> {
  static collectionName = 'users';
}

// ============================================
// EXAMPLE 1: Simple Cascade Delete
// ============================================

async function example1_SimpleCascadeDelete() {
  console.log('\n=== Example 1: Simple Cascade Delete ===\n');

  const gymId = 'gym123';

  try {
    await Gym.transaction(async (ctx) => {
      const gym = await Gym.load(gymId);
      if (!gym) throw new Error('Gym not found');

      // Delete gym and all its subcollections atomically
      await ctx.deleteCascade(gym, {
        subcollections: ['equipments', 'members', 'features'],
      });

      console.log('✅ Gym and all subcollections deleted atomically!');
    });
  } catch (error) {
    console.error('❌ Transaction failed:', error);
    console.log('All changes rolled back - data is consistent!');
  }
}

// ============================================
// EXAMPLE 2: Cascade Delete with Related Data
// ============================================

async function example2_CascadeDeleteWithRelatedData() {
  console.log('\n=== Example 2: Cascade Delete with Related Data ===\n');

  const gymId = 'gym123';

  try {
    await Gym.transaction(async (ctx) => {
      const gym = await Gym.load(gymId);
      if (!gym) throw new Error('Gym not found');

      // Delete gym with subcollections and related data
      await ctx.deleteCascade(gym, {
        subcollections: ['equipments', 'members', 'features'],
        onBeforeDelete: async () => {
          console.log('Deleting related data...');

          // Delete all gym staff
          const staff = await GymStaff.where('gymId', '==', gymId).get();
          console.log(`Found ${staff.length} staff members to delete`);

          for (const s of staff) {
            const staffModel = await GymStaff.load(s.id);
            if (staffModel) {
              await ctx.delete(staffModel);
            }
          }

          // Update users - remove gym from myGyms array
          const users = await User.where(
            'myGyms',
            'array-contains',
            gymId
          ).get();
          console.log(`Found ${users.length} users to update`);

          for (const u of users) {
            const user = await User.load(u.id);
            if (user) {
              const currentGyms = user.get('myGyms') || [];
              await ctx.update(user, {
                myGyms: currentGyms.filter((id) => id !== gymId),
              });
            }
          }
        },
      });

      console.log('✅ Complete atomic deletion successful!');
    });
  } catch (error) {
    console.error('❌ Transaction failed:', error);
    console.log('All changes rolled back - no orphaned data!');
  }
}

// ============================================
// EXAMPLE 3: Manual Subcollection Delete
// ============================================

async function example3_ManualSubcollectionDelete() {
  console.log('\n=== Example 3: Manual Subcollection Delete ===\n');

  const gymId = 'gym123';

  try {
    await Gym.transaction(async (ctx) => {
      const gym = await Gym.load(gymId);
      if (!gym) throw new Error('Gym not found');

      // Manually delete each subcollection
      console.log('Deleting equipments...');
      await ctx.deleteSubcollection(gym, 'equipments');

      console.log('Deleting members...');
      await ctx.deleteSubcollection(gym, 'members');

      console.log('Deleting features...');
      await ctx.deleteSubcollection(gym, 'features');

      // Delete parent document
      console.log('Deleting gym...');
      await ctx.delete(gym);

      console.log('✅ All deletions completed atomically!');
    });
  } catch (error) {
    console.error('❌ Transaction failed:', error);
  }
}

// ============================================
// EXAMPLE 4: Conditional Cascade Delete
// ============================================

async function example4_ConditionalCascadeDelete() {
  console.log('\n=== Example 4: Conditional Cascade Delete ===\n');

  const gymId = 'gym123';

  try {
    await Gym.transaction(async (ctx) => {
      const gym = await Gym.load(gymId);
      if (!gym) throw new Error('Gym not found');

      // Check if gym can be deleted
      if (gym.get('status') === 'active') {
        throw new Error('Cannot delete active gym');
      }

      // Check member count
      const members = await gym.subcollection('members').get();
      if (members.length > 0) {
        throw new Error(
          `Cannot delete gym with ${members.length} active members`
        );
      }

      // Safe to delete
      await ctx.deleteCascade(gym, {
        subcollections: ['equipments', 'features'],
        onBeforeDelete: async () => {
          // Notify staff
          const staff = await GymStaff.where('gymId', '==', gymId).get();
          console.log(`Notifying ${staff.length} staff members...`);

          // Delete staff records
          for (const s of staff) {
            const staffModel = await GymStaff.load(s.id);
            if (staffModel) await ctx.delete(staffModel);
          }
        },
      });

      console.log('✅ Gym deleted successfully!');
    });
  } catch (error) {
    console.error('❌ Cannot delete gym:', error.message);
  }
}

// ============================================
// EXAMPLE 5: Large Dataset (Non-Atomic)
// ============================================

async function example5_LargeDatasetDeletion() {
  console.log('\n=== Example 5: Large Dataset Deletion ===\n');

  const gymId = 'gym123';

  try {
    // Step 1: Delete large subcollections using batch (deleteAll)
    console.log('Step 1: Deleting large subcollections...');

    const equipmentCount = await Gym.subcollection(
      gymId,
      'equipments'
    ).deleteAll();
    console.log(`Deleted ${equipmentCount} equipment items`);

    const memberCount = await Gym.subcollection(gymId, 'members').deleteAll();
    console.log(`Deleted ${memberCount} members`);

    // Step 2: Delete related data and parent in transaction
    console.log('Step 2: Deleting related data and parent...');

    await Gym.transaction(async (ctx) => {
      const gym = await Gym.load(gymId);
      if (!gym) throw new Error('Gym not found');

      // Delete staff
      const staff = await GymStaff.where('gymId', '==', gymId).get();
      for (const s of staff) {
        const staffModel = await GymStaff.load(s.id);
        if (staffModel) await ctx.delete(staffModel);
      }

      // Update users
      const users = await User.where('myGyms', 'array-contains', gymId).get();
      for (const u of users) {
        const user = await User.load(u.id);
        if (user) {
          const currentGyms = user.get('myGyms') || [];
          await ctx.update(user, {
            myGyms: currentGyms.filter((id) => id !== gymId),
          });
        }
      }

      // Delete gym
      await ctx.delete(gym);
    });

    console.log('✅ Large dataset deletion completed!');
    console.log('⚠️  Note: Not fully atomic due to 500 doc limit');
  } catch (error) {
    console.error('❌ Deletion failed:', error);
  }
}

// ============================================
// EXAMPLE 6: Error Handling & Rollback
// ============================================

async function example6_ErrorHandlingAndRollback() {
  console.log('\n=== Example 6: Error Handling & Rollback ===\n');

  const gymId = 'gym123';

  try {
    await Gym.transaction(async (ctx) => {
      const gym = await Gym.load(gymId);
      if (!gym) throw new Error('Gym not found');

      await ctx.deleteCascade(gym, {
        subcollections: ['equipments', 'members'],
        onBeforeDelete: async () => {
          // Simulate an error during deletion
          const staff = await GymStaff.where('gymId', '==', gymId).get();

          for (const s of staff) {
            const staffModel = await GymStaff.load(s.id);
            if (staffModel) {
              // Check if staff has pending tasks
              if ((staffModel as any).get('hasPendingTasks')) {
                throw new Error('Cannot delete gym - staff has pending tasks');
              }
              await ctx.delete(staffModel);
            }
          }
        },
      });

      console.log('✅ Deletion successful!');
    });
  } catch (error) {
    console.error('❌ Transaction failed:', error.message);
    console.log('✅ All changes rolled back automatically!');
    console.log('   - Gym still exists');
    console.log('   - Subcollections intact');
    console.log('   - Staff records unchanged');
    console.log('   - Data consistency maintained!');
  }
}

// ============================================
// RUN ALL EXAMPLES
// ============================================

async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Atomic Cascade Delete Examples                     ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  await example1_SimpleCascadeDelete();
  await example2_CascadeDeleteWithRelatedData();
  await example3_ManualSubcollectionDelete();
  await example4_ConditionalCascadeDelete();
  await example5_LargeDatasetDeletion();
  await example6_ErrorHandlingAndRollback();

  console.log('\n✅ All examples completed!\n');
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  example1_SimpleCascadeDelete,
  example2_CascadeDeleteWithRelatedData,
  example3_ManualSubcollectionDelete,
  example4_ConditionalCascadeDelete,
  example5_LargeDatasetDeletion,
  example6_ErrorHandlingAndRollback,
};
