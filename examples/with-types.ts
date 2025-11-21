import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeOrm,
  Model,
  type ModelData,
  type CreateModelData,
  type UpdateModelData,
} from '../src';

// Initialize Firebase
const app = initializeApp({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
});

const firestore = getFirestore(app);
initializeOrm(firestore);

// ============================================
// DEFINE MODELS WITH TYPES
// ============================================

export interface UserData {
  id: string;
  name: string;
  email: string;
  age: number;
  roles: string[];
  status: 'active' | 'inactive' | 'banned';
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Model<UserData> {
  static collectionName = 'users';
}

export interface GymData {
  id: string;
  name: string;
  ownerId: string;
  address: {
    street: string;
    city: string;
    country: string;
  };
  memberCount: number;
  score: number;
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export class Gym extends Model<GymData> {
  static collectionName = 'gyms';
}

// ============================================
// TYPE-SAFE SERVICES
// ============================================

// Using exported interface
export async function getUserById(id: string): Promise<UserData | null> {
  return User.find(id);
}

export async function getActiveUsers(): Promise<UserData[]> {
  return User.where('status', '==', 'active').get();
}

// Using ModelData helper
export async function updateUserStatus(
  userId: string,
  status: ModelData<User>['status']
): Promise<void> {
  const user = await User.load(userId);
  if (user) {
    await user.update({ status });
  }
}

// Using CreateModelData (without id, timestamps)
type CreateUserInput = CreateModelData<User>;

export async function createUser(data: CreateUserInput): Promise<UserData> {
  const user = await User.create(data);
  return user.toJSON();
}

// Using UpdateModelData (partial, without id)
type UpdateUserInput = UpdateModelData<User>;

export async function updateUser(
  id: string,
  data: UpdateUserInput
): Promise<void> {
  const user = await User.load(id);
  if (user) {
    await user.update(data);
  }
}

// ============================================
// PAGINATION EXAMPLES
// ============================================

export async function getPaginatedUsers(page: number = 1) {
  const result = await User.where('status', '==', 'active')
    .orderBy('createdAt', 'desc')
    .paginate({ perPage: 20, page });

  return {
    users: result.data, // UserData[]
    pagination: result.meta,
  };
}

export async function getGymsInfiniteScroll(cursor?: string) {
  const result = await Gym.where('status', '==', 'active')
    .orderBy('score', 'desc')
    .cursorPaginate({ perPage: 20, afterCursor: cursor });

  return {
    gyms: result.data, // GymData[]
    nextCursor: result.nextCursor,
    hasMore: result.hasNextPage,
  };
}

// ============================================
// USAGE EXAMPLES
// ============================================

async function examples() {
  // Create with type safety
  const newUser: CreateUserInput = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 25,
    roles: ['user'],
    status: 'active',
  };

  const user = await createUser(newUser);
  console.log('Created user:', user.id);

  // Update with type safety
  const updates: UpdateUserInput = {
    name: 'Jane Doe',
    age: 26,
  };

  await updateUser(user.id, updates);

  // Query with full typing
  const activeUsers: UserData[] = await getActiveUsers();
  console.log('Active users:', activeUsers.length);

  // Pagination with default perPage (10)
  const { users, pagination } = await getPaginatedUsers(1);
  console.log('Page 1:', users.length);
  console.log('Total:', pagination.total);

  // Or with custom perPage
  const result = await User.paginate({ perPage: 50, page: 2 });
  console.log('Page 2 with 50 per page:', result.data.length);

  // Type-safe access
  users.forEach((u) => {
    console.log(u.name); // ✅ TypeScript knows this is a string
    console.log(u.age); // ✅ TypeScript knows this is a number
    // console.log(u.invalid); // ❌ TypeScript error
  });
}

examples().catch(console.error);
