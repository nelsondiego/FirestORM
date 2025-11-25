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
  age: number;
  status: 'active' | 'inactive';
  myGyms: string[];
  createdAt: Date;
  updatedAt: Date;
}

class User extends Model<UserData> {
  static collectionName = 'users';
}

// ============================================
// TYPESCRIPT TYPE INFERENCE EXAMPLES
// ============================================

async function typeInferenceExamples() {
  // ✅ find() - Returns UserData | null
  const user = await User.find('user123');
  if (user) {
    console.log(user.name); // TypeScript knows user.name exists
    console.log(user.email); // TypeScript knows user.email exists
    // console.log(user.invalid); // ❌ TypeScript error: Property 'invalid' does not exist
  }

  // ✅ findOrFail() - Returns UserData
  const userOrFail = await User.findOrFail('user123');
  console.log(userOrFail.name); // No need to check for null

  // ✅ all() - Returns UserData[]
  const allUsers = await User.all();
  allUsers.forEach((u) => {
    console.log(u.name); // TypeScript knows the structure
    console.log(u.email);
  });

  // ✅ where().get() - Returns UserData[]
  const activeUsers = await User.where('status', '==', 'active').get();
  activeUsers.forEach((u) => {
    console.log(u.status); // TypeScript knows status is 'active' | 'inactive'
  });

  // ✅ first() - Returns UserData | null
  const firstUser = await User.where('age', '>', 18).first();
  if (firstUser) {
    console.log(firstUser.age); // TypeScript knows age is number
  }

  // ✅ firstOrFail() - Returns UserData
  const firstOrFail = await User.where('status', '==', 'active').firstOrFail();
  console.log(firstOrFail.name); // No need to check for null

  // ✅ subcollection().get() - Returns UserData[]
  const gymMembers = await User.subcollection('gym123', 'members').get();
  gymMembers.forEach((member) => {
    console.log(member.name); // TypeScript knows the structure
  });

  // ✅ Array methods with proper typing
  const users = await User.where('myGyms', 'array-contains', 'gym123').get();

  // Filter with type safety
  const adults = users.filter((u) => u.age >= 18);

  // Map with type safety
  const names = users.map((u) => u.name);

  // Find with type safety
  const john = users.find((u) => u.name === 'John');

  // ✅ Pagination with proper typing
  const paginated = await User.where('status', '==', 'active').paginate({
    perPage: 20,
    page: 1,
  });

  paginated.data.forEach((u) => {
    console.log(u.name); // TypeScript knows the structure
  });

  console.log(paginated.meta.total); // TypeScript knows meta structure

  // ✅ Real-time updates with proper typing
  const unsubscribe = User.where('status', '==', 'active').listen((users) => {
    // users is UserData[]
    users.forEach((u) => {
      console.log(u.name); // TypeScript knows the structure
    });
  });

  // ✅ Single document listen with proper typing
  const unsubscribeDoc = User.listen('user123', (user) => {
    if (user) {
      // user is UserData
      console.log(user.name);
    } else {
      console.log('User deleted or does not exist');
    }
  });

  // ✅ Create returns model instance
  const newUser = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    age: 25,
    status: 'active',
    myGyms: [],
  });

  // Can use immediately
  await newUser.update({ age: 26 });
  console.log(newUser.id); // TypeScript knows id exists

  // ✅ Load returns model instance
  const loadedUser = await User.load('user123');
  if (loadedUser) {
    await loadedUser.update({ name: 'New Name' });
    console.log(loadedUser.get('name')); // TypeScript knows get() method
  }

  // ✅ Query builder chaining with type safety
  const result = await User.where('status', '==', 'active')
    .where('age', '>=', 18)
    .orderBy('name', 'asc')
    .limit(10)
    .get();

  // result is UserData[]
  result.forEach((u) => {
    console.log(u.name, u.age, u.status);
  });

  // ✅ Count and exists with proper typing
  const count: number = await User.where('status', '==', 'active').count();
  const exists: boolean = await User.where(
    'email',
    '==',
    'test@example.com'
  ).exists();

  console.log(`Active users: ${count}`);
  console.log(`Email exists: ${exists}`);

  // Cleanup
  unsubscribe();
  unsubscribeDoc();
}

// ============================================
// NO EXPLICIT TYPE ANNOTATIONS NEEDED
// ============================================

async function noAnnotationsNeeded() {
  // Before (v0.1.11 and earlier): Had to use explicit types
  // const users: UserData[] = await User.where('status', '==', 'active').get();

  // After (v0.1.12): TypeScript infers automatically ✅
  const users = await User.where('status', '==', 'active').get();
  // users is automatically typed as UserData[]

  const user = await User.find('user123');
  // user is automatically typed as UserData | null

  const firstUser = await User.query().first();
  // firstUser is automatically typed as UserData | null

  const allUsers = await User.all();
  // allUsers is automatically typed as UserData[]

  // All without explicit type annotations! 🎉
}

// Run examples
async function main() {
  try {
    await typeInferenceExamples();
    await noAnnotationsNeeded();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
