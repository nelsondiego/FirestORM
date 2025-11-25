# NDFirestORM 🔥

> Eloquent-style ORM for Firebase Firestore with TypeScript

[![npm version](https://img.shields.io/npm/v/ndfirestorm.svg)](https://www.npmjs.com/package/ndfirestorm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

✨ **Eloquent-style API** - Familiar syntax for Laravel developers  
🔥 **Firebase Firestore** - Built specifically for Firestore  
📘 **TypeScript First** - Full type safety and IntelliSense  
🎯 **Query Builder** - Fluent, chainable query interface  
📄 **JSON First** - Returns plain objects by default (faster, API-ready)  
🆔 **ID Auto-included** - Document ID always in the object  
📊 **Pagination** - Three types: standard, simple, and cursor-based  
🔴 **Real-time** - Built-in support for live subscriptions  
🔄 **Transactions** - Atomic operations with full type safety  
📦 **Batch Operations** - Efficient bulk writes (up to 500 ops)  
🗂️ **Subcollections** - Full support for nested collections  
🗑️ **Batch Delete** - Delete all documents matching a query  
💥 **Atomic Cascade Delete** - Delete documents with subcollections atomically (NEW!)  
🆔 **Custom IDs** - Support for custom document IDs  
⚡ **Performance** - Zero overhead, no unnecessary class instantiation  
🧪 **Well Tested** - Comprehensive test coverage

## Installation

```bash
npm install ndfirestorm firebase
```

## Quick Start

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeOrm, Model, type ModelData } from 'ndfirestorm';

// Initialize Firebase
const app = initializeApp({
  /* config */
});
const firestore = getFirestore(app);

// Initialize ORM
initializeOrm(firestore);

// Define your data interface
interface UserData {
  id: string;
  email: string;
  name: string;
  age: number;
}

// Define a model with type
class User extends Model<UserData> {
  static collectionName = 'users';
}

// Use it with full type safety!
const user = await User.create({
  email: 'test@example.com',
  name: 'John Doe',
  age: 25,
});

// ✅ Results are fully typed
const users: UserData[] = await User.where('age', '>=', 18).get();
```

## Core Concepts

### JSON First Approach

By default, all methods return plain JSON objects (not model instances). This is faster and perfect for APIs.

```typescript
// ✅ Reading data - Returns JSON (default)
const users = await User.all(); // UserData[]
const user = await User.find('abc123'); // UserData | null
const firstUser = await User.first(); // UserData | null

// ✅ create() returns model instance
const user = await User.create({ name: 'John', email: 'john@example.com' });
await user.update({ name: 'Jane' });

// ✅ load() gets instance for update/delete
const user = await User.load('abc123');
await user?.update({ name: 'Jane' });
await user?.delete();
```

### Type Safety

Export and use model types anywhere in your application:

```typescript
// models/User.ts
export interface UserData {
  id: string;
  name: string;
  email: string;
}

export class User extends Model<UserData> {
  static collectionName = 'users';
}

// services/userService.ts
import { User, UserData } from '@/models/User';

export async function getUser(id: string): Promise<UserData | null> {
  return User.find(id); // ✅ Returns UserData | null
}

// Or use type helpers
import { ModelData, CreateModelData } from 'ndfirestorm';

type UserType = ModelData<User>; // Same as UserData
type CreateUserInput = CreateModelData<User>; // Without id, timestamps
```

## API Reference

### Query Methods

```typescript
// Basic queries
const users = await User.all();
const user = await User.find('id');
const user = await User.where('email', '==', 'test@example.com').first();

// Chaining
const activeUsers = await User.where('status', '==', 'active')
  .where('age', '>=', 18)
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();

// Operators: ==, !=, >, <, >=, <=, in, not-in, array-contains
```

### CRUD Operations

```typescript
// Create
const user = await User.create({
  name: 'John',
  email: 'john@example.com',
});

// Read
const user = await User.find('id'); // Returns JSON

// Update by ID (fastest)
await User.update('id', { name: 'Jane' });

// Or load and update (for hooks/validation)
const user = await User.load('id'); // Returns model instance
await user?.update({ name: 'Jane' });

// Delete by ID (no need to load)
await User.destroy('id');

// Or load and delete (for soft deletes or hooks)
await user.delete();

// Batch delete all matching documents
await User.where('status', '==', 'inactive').deleteAll();
```

### Pagination

```typescript
// Standard pagination (with total count)
const result = await User.where('status', '==', 'active').paginate({
  perPage: 20, // optional, default 10
  page: 1, // optional, default 1
});

console.log(result.data); // UserData[]
console.log(result.meta); // { total, perPage, currentPage, lastPage, ... }

// Default pagination (10 per page, page 1)
const result = await User.paginate();

// Simple pagination (cursor-based, more efficient)
const result = await User.simplePaginate({
  perPage: 50,
  cursor: lastDoc,
});

// Cursor pagination (for infinite scroll)
const result = await User.cursorPaginate({
  perPage: 20,
  afterCursor: 'doc-id',
});
```

### Real-time Subscriptions

```typescript
// Listen to a single document (receives JSON)
const unsubscribe = User.listen('user-id', (user) => {
  if (user) {
    console.log('User updated:', user); // Already JSON!
  } else {
    console.log('User deleted');
  }
});

// Listen to query results (receives JSON array)
const unsubscribe = User.where('role', '==', 'admin').listen((admins) => {
  console.log('Admins updated:', admins); // Array of JSON objects
});

// Stop listening
unsubscribe();
```

### Transactions

```typescript
// Atomic operations - NO Firestore code needed!
await User.transaction(async (ctx) => {
  const user = await User.load('user1');
  const gym = await Gym.load('gym1');

  if (user && gym) {
    await ctx.update(user, { gymId: gym.id });
    await ctx.update(gym, { memberCount: gym.get('memberCount') + 1 });
  }
});
```

### Batch Operations

```typescript
// Bulk writes (up to 500 operations) - NO Firestore code needed!
await User.batch(async (ctx) => {
  const user1 = await User.load('user1');
  const user2 = await User.load('user2');

  if (user1) ctx.update(user1, { status: 'active' });
  if (user2) ctx.update(user2, { status: 'active' });
});
```

### Subcollections - Complete CRUD (NEW!)

```typescript
const gym = await Gym.load('gym123');

// CREATE - Add documents to subcollection
const equipment = await gym.subcollection('equipments').create({
  name: 'Treadmill',
  quantity: 5,
  status: 'active',
});

// READ - Query subcollections
const equipments = await gym.subcollection('equipments').get();
const activeEquipments = await gym
  .subcollection('equipments')
  .where('status', '==', 'active')
  .get();

// FIND - Get specific document
const found = await gym.subcollection('equipments').find('equipment123');

// UPDATE - Modify document
await gym.subcollection('equipments').update('equipment123', {
  quantity: 10,
});

// DELETE - Remove document
await gym.subcollection('equipments').destroy('equipment123');

// DELETE ALL - Remove all documents
await gym.subcollection('equipments').deleteAll();
```

### Atomic Subcollection Deletion

```typescript
// Delete document with all subcollections atomically
await Gym.transaction(async (ctx) => {
  const gym = await Gym.load('gym123');
  if (!gym) throw new Error('Gym not found');

  // Delete gym and all subcollections in one atomic operation
  await ctx.deleteCascade(gym, {
    subcollections: ['equipments', 'members', 'features'],
    onBeforeDelete: async () => {
      // Delete related collections
      const staff = await GymStaff.where('gymId', '==', gym.id).get();
      for (const s of staff) {
        const staffModel = await GymStaff.load(s.id);
        if (staffModel) await ctx.delete(staffModel);
      }
    },
  });
});

// ✅ Either everything succeeds or nothing changes - true atomicity!
```

### Custom IDs

```typescript
// Create with custom ID (perfect for Firebase Auth sync)
const user = await User.create(
  { name: 'John', email: 'john@example.com' },
  'custom-user-id'
);

// Or include ID in data
const user = await User.create({
  id: 'my-custom-id',
  name: 'Jane',
  email: 'jane@example.com',
});
```

## Type Utilities

```typescript
import {
  ModelData,
  InferModelType,
  CreateModelData,
  UpdateModelData,
} from 'firestorm';

// Extract type from model
type UserType = ModelData<User>;

// Type for creating (without id, timestamps)
type CreateUserInput = CreateModelData<User>;

// Type for updating (partial, without id)
type UpdateUserInput = UpdateModelData<User>;
```

## Examples

### React Hook

```typescript
function useUser(userId: string) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    User.find(userId).then((data) => {
      setUser(data);
      setLoading(false);
    });
  }, [userId]);

  return { user, loading };
}
```

### API Route (Next.js)

```typescript
export async function GET(request: NextRequest) {
  const users = await User.where('status', '==', 'active').get();
  return NextResponse.json(users); // Already JSON!
}
```

### Pinia Store

```typescript
export const useUserStore = defineStore('user', {
  state: () => ({
    users: [] as UserData[],
  }),

  actions: {
    async loadUsers() {
      this.users = await User.all();
    },
  },
});
```

## Comparison with Other ORMs

| Feature        | NDFirestORM      | Fireorm       | Typesaurus    |
| -------------- | ---------------- | ------------- | ------------- |
| TypeScript     | ✅ First-class   | ✅ Yes        | ✅ Yes        |
| JSON First     | ✅ Default       | ❌ Always ORM | ❌ Always ORM |
| ID in Object   | ✅ Auto-included | ⚠️ Separate   | ⚠️ Separate   |
| Pagination     | ✅ 3 types       | ⚠️ Basic      | ⚠️ Basic      |
| Type Utilities | ✅ Full helpers  | ⚠️ Basic      | ⚠️ Basic      |

## License

MIT © Diego Nelson

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
