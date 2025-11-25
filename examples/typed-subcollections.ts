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
// DEFINE MODELS WITH TYPED SUBCOLLECTIONS
// ============================================

// Parent Model
interface GymData {
  id: string;
  name: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

class Gym extends Model<GymData> {
  static collectionName = 'gyms';
}

// Subcollection Models
interface EquipmentData {
  id: string;
  name: string;
  quantity: number;
  status: 'active' | 'maintenance' | 'broken';
  purchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class Equipment extends Model<EquipmentData> {
  static collectionName = 'equipments'; // Subcollection name
}

interface FeatureData {
  id: string;
  icon: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

class Feature extends Model<FeatureData> {
  static collectionName = 'features'; // Subcollection name
}

interface MemberData {
  id: string;
  userId: string;
  membershipType: 'basic' | 'premium' | 'vip';
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

class Member extends Model<MemberData> {
  static collectionName = 'members'; // Subcollection name
}

// ============================================
// TYPED SUBCOLLECTION OPERATIONS
// ============================================

async function typedSubcollectionExamples() {
  console.log('=== Typed Subcollection Operations ===\n');

  // Create a gym
  const gym = await Gym.create({
    name: 'Elite Fitness Center',
    location: 'Downtown',
  });

  console.log(`Created gym: ${gym.id}\n`);

  // ============================================
  // CREATE with Type Safety
  // ============================================

  console.log('--- CREATE with Type Safety ---');

  // ✅ TypeScript knows this returns EquipmentData
  const treadmill = await gym.subcollection(Equipment).create({
    name: 'Treadmill Pro 3000',
    quantity: 5,
    status: 'active',
    purchaseDate: new Date(),
  });

  console.log('Created equipment:', treadmill);
  // TypeScript autocomplete works: treadmill.name, treadmill.quantity, etc.

  // ✅ TypeScript knows this returns FeatureData
  const wifi = await gym.subcollection(Feature).create(
    {
      icon: 'wifi',
      title: 'WiFi Gratis',
      description: 'Internet de alta velocidad',
    },
    'wifi' // Custom ID
  );

  console.log('Created feature:', wifi);
  // TypeScript autocomplete works: wifi.icon, wifi.title, etc.

  // ✅ TypeScript knows this returns MemberData
  const member = await gym.subcollection(Member).create({
    userId: 'user123',
    membershipType: 'premium',
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    status: 'active',
  });

  console.log('Created member:', member);
  // TypeScript autocomplete works: member.membershipType, member.status, etc.

  console.log('\n');

  // ============================================
  // READ with Type Safety
  // ============================================

  console.log('--- READ with Type Safety ---');

  // ✅ equipments is typed as EquipmentData[]
  const equipments = await gym.subcollection(Equipment).get();
  console.log(`Total equipment: ${equipments.length}`);

  equipments.forEach((eq) => {
    // TypeScript knows all properties
    console.log(`- ${eq.name}: ${eq.quantity} units (${eq.status})`);
  });

  // ✅ features is typed as FeatureData[]
  const features = await gym.subcollection(Feature).get();
  console.log(`\nTotal features: ${features.length}`);

  features.forEach((f) => {
    // TypeScript knows all properties
    console.log(`- ${f.icon}: ${f.title}`);
  });

  // ✅ members is typed as MemberData[]
  const members = await gym.subcollection(Member).get();
  console.log(`\nTotal members: ${members.length}`);

  members.forEach((m) => {
    // TypeScript knows all properties
    console.log(`- ${m.userId}: ${m.membershipType} (${m.status})`);
  });

  console.log('\n');

  // ============================================
  // QUERY with Type Safety
  // ============================================

  console.log('--- QUERY with Type Safety ---');

  // ✅ activeEquipment is typed as EquipmentData[]
  const activeEquipment = await gym
    .subcollection(Equipment)
    .where('status', '==', 'active')
    .get();

  console.log(`Active equipment: ${activeEquipment.length}`);

  // ✅ premiumMembers is typed as MemberData[]
  const premiumMembers = await gym
    .subcollection(Member)
    .where('membershipType', '==', 'premium')
    .where('status', '==', 'active')
    .get();

  console.log(`Premium members: ${premiumMembers.length}`);

  // ✅ sortedEquipment is typed as EquipmentData[]
  const sortedEquipment = await gym
    .subcollection(Equipment)
    .orderBy('quantity', 'desc')
    .limit(5)
    .get();

  console.log(`Top 5 equipment by quantity: ${sortedEquipment.length}`);

  console.log('\n');

  // ============================================
  // FIND with Type Safety
  // ============================================

  console.log('--- FIND with Type Safety ---');

  // ✅ foundEquipment is typed as EquipmentData | null
  const foundEquipment = await gym.subcollection(Equipment).find(treadmill.id);

  if (foundEquipment) {
    console.log('Found equipment:', foundEquipment.name);
    // TypeScript knows all properties
    console.log(`Quantity: ${foundEquipment.quantity}`);
    console.log(`Status: ${foundEquipment.status}`);
  }

  // ✅ foundFeature is typed as FeatureData | null
  const foundFeature = await gym.subcollection(Feature).find('wifi');

  if (foundFeature) {
    console.log('\nFound feature:', foundFeature.title);
    // TypeScript knows all properties
    console.log(`Icon: ${foundFeature.icon}`);
    console.log(`Description: ${foundFeature.description}`);
  }

  console.log('\n');

  // ============================================
  // UPDATE with Type Safety
  // ============================================

  console.log('--- UPDATE with Type Safety ---');

  // ✅ TypeScript validates the data structure
  await gym.subcollection(Equipment).update(treadmill.id, {
    quantity: 3,
    status: 'maintenance',
  });

  console.log('Updated equipment');

  // ✅ TypeScript validates the data structure
  await gym.subcollection(Member).update(member.id, {
    membershipType: 'vip',
  });

  console.log('Updated member');

  console.log('\n');

  // ============================================
  // DELETE with Type Safety
  // ============================================

  console.log('--- DELETE with Type Safety ---');

  await gym.subcollection(Equipment).destroy(treadmill.id);
  console.log('Deleted equipment');

  await gym.subcollection(Feature).destroy('wifi');
  console.log('Deleted feature');

  console.log('\n');

  // ============================================
  // REAL-TIME with Type Safety
  // ============================================

  console.log('--- REAL-TIME with Type Safety ---');

  // ✅ callback receives EquipmentData[]
  const unsubscribeEquipment = gym
    .subcollection(Equipment)
    .listen((equipments) => {
      console.log(`Equipment updated: ${equipments.length} items`);
      equipments.forEach((eq) => {
        // TypeScript knows all properties
        console.log(`- ${eq.name}: ${eq.quantity}`);
      });
    });

  // ✅ callback receives MemberData[]
  const unsubscribeMembers = gym
    .subcollection(Member)
    .where('status', '==', 'active')
    .listen((activeMembers) => {
      console.log(`Active members: ${activeMembers.length}`);
      activeMembers.forEach((m) => {
        // TypeScript knows all properties
        console.log(`- ${m.userId}: ${m.membershipType}`);
      });
    });

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Cleanup
  unsubscribeEquipment();
  unsubscribeMembers();

  console.log('\n');
}

// ============================================
// STATIC METHODS with Type Safety
// ============================================

async function staticTypedSubcollectionExamples() {
  console.log('=== Static Typed Subcollection Operations ===\n');

  const gymId = 'gym123';

  // ✅ equipment is typed as EquipmentData
  const equipment = await Gym.subcollection(gymId, Equipment).create({
    name: 'Rowing Machine',
    quantity: 4,
    status: 'active',
  });

  console.log('Created equipment (static):', equipment);
  // TypeScript knows all properties

  // ✅ equipments is typed as EquipmentData[]
  const equipments = await Gym.subcollection(gymId, Equipment).get();
  console.log(`Total equipment: ${equipments.length}`);

  // ✅ found is typed as EquipmentData | null
  const found = await Gym.subcollection(gymId, Equipment).find(equipment.id);
  if (found) {
    console.log('Found equipment:', found.name);
  }

  // ✅ TypeScript validates the data structure
  await Gym.subcollection(gymId, Equipment).update(equipment.id, {
    quantity: 5,
  });

  console.log('Updated equipment');

  // ✅ Delete
  await Gym.subcollection(gymId, Equipment).destroy(equipment.id);
  console.log('Deleted equipment');

  console.log('\n');
}

// ============================================
// COMPARISON: String vs Typed
// ============================================

async function comparisonExample() {
  console.log('=== Comparison: String vs Typed ===\n');

  const gym = await Gym.create({
    name: 'Comparison Gym',
    location: 'Test',
  });

  // ❌ String-based (no type safety)
  const equipments1 = await gym.subcollection('equipments').get();
  // equipments1 is typed as any[] - no autocomplete!

  // ✅ Model-based (full type safety)
  const equipments2 = await gym.subcollection(Equipment).get();
  // equipments2 is typed as EquipmentData[] - full autocomplete!

  equipments2.forEach((eq) => {
    console.log(eq.name); // ✅ TypeScript knows this property
    console.log(eq.quantity); // ✅ TypeScript knows this property
    console.log(eq.status); // ✅ TypeScript knows this property
  });

  console.log('\n');
}

// Run all examples
async function main() {
  try {
    await typedSubcollectionExamples();
    await staticTypedSubcollectionExamples();
    await comparisonExample();

    console.log('✅ All typed subcollection examples completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
