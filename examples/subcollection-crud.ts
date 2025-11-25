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

// Define models
interface GymData {
  id: string;
  name: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EquipmentData {
  id: string;
  name: string;
  quantity: number;
  status: 'active' | 'maintenance' | 'broken';
  createdAt: Date;
  updatedAt: Date;
}

interface FeatureData {
  id: string;
  icon: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

class Gym extends Model<GymData> {
  static collectionName = 'gyms';
}

// ============================================
// SUBCOLLECTION CRUD OPERATIONS
// ============================================

async function subcollectionCRUDExamples() {
  console.log('=== Subcollection CRUD Operations ===\n');

  // Create a gym first
  const gym = await Gym.create({
    name: 'PowerFit Gym',
    location: 'Downtown',
  });

  console.log(`Created gym: ${gym.id}\n`);

  // ============================================
  // CREATE - Add documents to subcollection
  // ============================================

  console.log('--- CREATE Operations ---');

  // Create equipment with auto-generated ID
  const treadmill = await gym.subcollection('equipments').create({
    name: 'Treadmill Pro 3000',
    quantity: 5,
    status: 'active',
  });

  console.log('Created equipment:', treadmill);

  // Create equipment with custom ID
  const dumbbell = await gym.subcollection('equipments').create(
    {
      name: 'Dumbbell Set',
      quantity: 20,
      status: 'active',
    },
    'dumbbell-set-001'
  );

  console.log('Created equipment with custom ID:', dumbbell);

  // Create multiple equipment
  const bike = await gym.subcollection('equipments').create({
    name: 'Stationary Bike',
    quantity: 10,
    status: 'active',
  });

  const elliptical = await gym.subcollection('equipments').create({
    name: 'Elliptical Machine',
    quantity: 8,
    status: 'active',
  });

  console.log('\n');

  // ============================================
  // READ - Query subcollection documents
  // ============================================

  console.log('--- READ Operations ---');

  // Get all equipment
  const allEquipment = await gym.subcollection('equipments').get();
  console.log(`Total equipment: ${allEquipment.length}`);

  // Find specific equipment by ID
  const foundEquipment = await gym
    .subcollection('equipments')
    .find(treadmill.id);
  console.log('Found equipment:', foundEquipment);

  // Query with filters
  const activeEquipment = await gym
    .subcollection('equipments')
    .where('status', '==', 'active')
    .get();
  console.log(`Active equipment: ${activeEquipment.length}`);

  // Query with ordering
  const sortedEquipment = await gym
    .subcollection('equipments')
    .orderBy('quantity', 'desc')
    .get();
  console.log('Equipment sorted by quantity:', sortedEquipment);

  console.log('\n');

  // ============================================
  // UPDATE - Modify subcollection documents
  // ============================================

  console.log('--- UPDATE Operations ---');

  // Update equipment quantity
  await gym.subcollection('equipments').update(treadmill.id, {
    quantity: 3,
  });
  console.log(`Updated treadmill quantity to 3`);

  // Update equipment status
  await gym.subcollection('equipments').update(bike.id, {
    status: 'maintenance',
  });
  console.log(`Updated bike status to maintenance`);

  // Update multiple fields
  await gym.subcollection('equipments').update(elliptical.id, {
    quantity: 6,
    status: 'active',
  });
  console.log(`Updated elliptical quantity and status`);

  // Verify updates
  const updatedTreadmill = await gym
    .subcollection('equipments')
    .find(treadmill.id);
  console.log('Updated treadmill:', updatedTreadmill);

  console.log('\n');

  // ============================================
  // DELETE - Remove subcollection documents
  // ============================================

  console.log('--- DELETE Operations ---');

  // Delete single equipment
  await gym.subcollection('equipments').destroy(dumbbell.id);
  console.log(`Deleted equipment: ${dumbbell.id}`);

  // Verify deletion
  const deletedEquipment = await gym
    .subcollection('equipments')
    .find(dumbbell.id);
  console.log(`Equipment exists after delete: ${deletedEquipment !== null}`);

  // Delete all equipment in maintenance
  const maintenanceCount = await gym
    .subcollection('equipments')
    .where('status', '==', 'maintenance')
    .deleteAll();
  console.log(`Deleted ${maintenanceCount} equipment in maintenance`);

  // Delete all remaining equipment
  const remainingCount = await gym.subcollection('equipments').deleteAll();
  console.log(`Deleted ${remainingCount} remaining equipment`);

  console.log('\n');
}

// ============================================
// FEATURES MANAGEMENT EXAMPLE
// ============================================

async function featuresManagementExample() {
  console.log('=== Features Management ===\n');

  const gym = await Gym.create({
    name: 'Elite Fitness',
    location: 'Uptown',
  });

  // Add features with custom IDs
  await gym.subcollection('features').create(
    {
      icon: 'wifi',
      title: 'WiFi Gratis',
      description: 'Internet de alta velocidad',
    },
    'wifi'
  );

  await gym.subcollection('features').create(
    {
      icon: 'parking',
      title: 'Estacionamiento',
      description: 'Estacionamiento gratuito',
    },
    'parking'
  );

  await gym.subcollection('features').create(
    {
      icon: 'shower',
      title: 'Duchas',
      description: 'Duchas con agua caliente',
    },
    'shower'
  );

  console.log('Created 3 features');

  // Get all features
  const features = await gym.subcollection('features').get();
  console.log(`Total features: ${features.length}`);
  features.forEach((f: any) => console.log(`- ${f.title}`));

  // Update a feature
  await gym.subcollection('features').update('wifi', {
    title: 'WiFi de Alta Velocidad',
    description: 'Fibra óptica 1Gbps',
  });
  console.log('\nUpdated WiFi feature');

  // Remove a feature
  await gym.subcollection('features').destroy('parking');
  console.log('Removed parking feature');

  // Final count
  const finalFeatures = await gym.subcollection('features').get();
  console.log(`\nFinal features count: ${finalFeatures.length}`);

  console.log('\n');
}

// ============================================
// STATIC METHODS EXAMPLE
// ============================================

async function staticMethodsExample() {
  console.log('=== Static Methods (Without Loading Gym) ===\n');

  // You can also use static methods without loading the gym first
  const gymId = 'gym123';

  // Create equipment using static method
  const equipment = await Gym.subcollection(gymId, 'equipments').create({
    name: 'Rowing Machine',
    quantity: 4,
    status: 'active',
  });

  console.log('Created equipment (static):', equipment);

  // Update using static method
  await Gym.subcollection(gymId, 'equipments').update(equipment.id, {
    quantity: 5,
  });

  console.log('Updated equipment (static)');

  // Find using static method
  const found = await Gym.subcollection(gymId, 'equipments').find(equipment.id);
  console.log('Found equipment (static):', found);

  // Delete using static method
  await Gym.subcollection(gymId, 'equipments').destroy(equipment.id);
  console.log('Deleted equipment (static)');

  console.log('\n');
}

// ============================================
// REAL-TIME UPDATES EXAMPLE
// ============================================

async function realtimeUpdatesExample() {
  console.log('=== Real-time Updates ===\n');

  const gym = await Gym.create({
    name: 'Dynamic Gym',
    location: 'City Center',
  });

  // Listen to equipment changes
  const unsubscribe = gym.subcollection('equipments').listen((equipments) => {
    console.log(`Equipment count: ${equipments.length}`);
    equipments.forEach((e: any) => {
      console.log(`- ${e.name}: ${e.quantity} units (${e.status})`);
    });
    console.log('---');
  });

  // Add equipment (will trigger listener)
  await gym.subcollection('equipments').create({
    name: 'Bench Press',
    quantity: 3,
    status: 'active',
  });

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Add more equipment (will trigger listener)
  await gym.subcollection('equipments').create({
    name: 'Squat Rack',
    quantity: 2,
    status: 'active',
  });

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Stop listening
  unsubscribe();
  console.log('Stopped listening\n');
}

// Run all examples
async function main() {
  try {
    await subcollectionCRUDExamples();
    await featuresManagementExample();
    await staticMethodsExample();
    await realtimeUpdatesExample();

    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
