import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeOrm, Model, type ModelData } from '../src';

// Initialize Firebase
const app = initializeApp({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
});

const firestore = getFirestore(app);

// Initialize ORM
initializeOrm(firestore);

// ============================================
// DEFINE YOUR MODELS
// ============================================

interface UserData {
  id: string;
  name: string;
  email: string;
  age: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

class User extends Model<UserData> {
  static collectionName = 'users';
}

// ============================================
// USAGE EXAMPLES
// ============================================

async function examples() {
  // Create a user
  const user = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    age: 25,
    status: 'active',
  });

  console.log('Created user:', user.id);

  // Find by ID (returns JSON)
  const foundUser: UserData | null = await User.find(user.id!);
  console.log('Found user:', foundUser);

  // Query users (returns JSON array)
  const activeUsers: UserData[] = await User.where('status', '==', 'active')
    .where('age', '>=', 18)
    .orderBy('createdAt', 'desc')
    .get();

  console.log('Active users:', activeUsers.length);

  // Get first user
  const firstUser: UserData | null = await User.where(
    'email',
    '==',
    'john@example.com'
  ).first();

  console.log('First user:', firstUser?.name);

  // Pagination
  const paginated = await User.where('status', '==', 'active').paginate({
    perPage: 10,
    page: 1,
  });

  console.log('Page 1 users:', paginated.data.length);
  console.log('Total users:', paginated.meta.total);
  console.log('Has more pages:', paginated.meta.hasMorePages

  // Update user by ID (fastest way)
  await User.update(user.id!, { name: 'Jane Doe', age: 26 });
  console.log('Updated user by ID');

  // Or load and update (for validation/hooks)
  const userModel = await User.load(user.id!);
  if (userModel) {
    await userModel.update({ status: 'inactive' });
    console.log('Updated user with model instance');
  }

  // Delete user by ID (fastest way)
  await User.destroy(user.id!);
  console.log('Deleted user by ID');

  // Or load and delete (for soft deletes/hooks)
  // await userModel?.delete();
}

// Run examples
examples().catch(console.error);
