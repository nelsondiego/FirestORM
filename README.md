# NDFirestORM 🔥

> Eloquent-style ORM for Firebase Firestore with TypeScript

[![npm version](https://img.shields.io/npm/v/ndfirestorm.svg)](https://www.npmjs.com/package/ndfirestorm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**NDFirestORM** is a modern, type-safe ORM for Firebase Firestore that brings the elegance of Laravel's Eloquent to the TypeScript/JavaScript ecosystem. Write clean, intuitive database queries without touching Firestore's API directly.

## Why NDFirestORM?

Stop writing verbose Firestore code. Start writing elegant, type-safe queries:

```typescript
// ❌ Without NDFirestORM (verbose Firestore code)
import {
  collection,
  query,
  where,
  getDocs,
  getFirestore,
} from 'firebase/firestore';

const firestore = getFirestore();
const usersRef = collection(firestore, 'users');
const q = query(
  usersRef,
  where('status', '==', 'active'),
  where('age', '>=', 18)
);
const snapshot = await getDocs(q);
const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

// ✅ With NDFirestORM (clean and elegant)
const users = await User.where('status', '==', 'active')
  .where('age', '>=', 18)
  .get();
```

**Key Benefits:**

- 🎯 **Zero Firestore Code** - Never write `collection()`, `doc()`, or `getDocs()` again
- 📘 **100% Type Safe** - Full TypeScript support with intelligent autocomplete
- ⚡ **Performance First** - JSON-first approach, no unnecessary overhead
- 🔄 **Real-time Ready** - Built-in support for live subscriptions
- 🗂️ **Subcollections Made Easy** - Full CRUD support for nested collections
- 💰 **Cost Optimized** - Built-in patterns to reduce Firestore operations

## Features

✨ **Eloquent-style API** - Familiar syntax for Laravel developers  
🔥 **Firebase Firestore** - Built specifically for Firestore  
📘 **TypeScript First** - Full type safety and IntelliSense  
🎯 **Query Builder** - Fluent, chainable query interface  
📄 **JSON First** - Returns plain objects by default (faster, API-ready)  
🆔 **ID Auto-included** - Document ID always in the object  
🔢 **Numeric IDs** - Use numbers in code (auto-converted to strings for Firestore) (NEW!)  
📊 **Pagination** - Three types: standard, simple, and cursor-based  
🔴 **Real-time** - Built-in support for live subscriptions  
🔄 **Transactions** - Atomic operations with full type safety  
📦 **Batch Operations** - Efficient bulk writes (up to 500 ops)  
🗂️ **Subcollections** - Full support for nested collections  
🗑️ **Batch Delete** - Delete all documents matching a query  
💥 **Atomic Cascade Delete** - Delete documents with subcollections atomically  
🆔 **Custom IDs** - Support for custom document IDs  
⚡ **Performance** - Zero overhead, no unnecessary class instantiation  
🧪 **Well Tested** - Comprehensive test coverage

## Installation

```bash
npm install ndfirestorm firebase
```

## Quick Start

Get up and running in 3 simple steps:

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

That's it! No more Firestore boilerplate. Just clean, type-safe queries.

## Documentation

📚 **[Complete Documentation](./docs/README.md)** - Comprehensive guides and examples

**Quick Links:**

- [Getting Started](./docs/01-getting-started.md) - Setup and first model
- [Defining Models](./docs/02-defining-models.md) - Model structure and types
- [Queries](./docs/03-queries.md) - Query builder and filters
- [CRUD Operations](./docs/04-crud-operations.md) - Create, read, update, delete
- [Pagination](./docs/05-pagination.md) - Three pagination strategies
- [Real-time & Transactions](./docs/07-realtime-transactions.md) - Live updates and atomic operations
- [Subcollections](./docs/09-subcollections.md) - Nested collections support
- [Field Value Utilities](./docs/10-field-values.md) - Atomic operations

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

Build queries with a fluent, chainable interface:

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

Create, read, update, and delete documents with simple methods:

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

Three pagination strategies for different use cases:

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

Listen to live updates with automatic JSON conversion:

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

Execute multiple operations atomically - all succeed or all fail:

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

Perform bulk writes efficiently (up to 500 operations):

```typescript
// Bulk writes (up to 500 operations) - NO Firestore code needed!
await User.batch(async (ctx) => {
  const user1 = await User.load('user1');
  const user2 = await User.load('user2');

  if (user1) ctx.update(user1, { status: 'active' });
  if (user2) ctx.update(user2, { status: 'active' });
});
```

### Subcollections

Full CRUD support for nested collections with type safety:

```typescript
// Define subcollection model
interface EquipmentData {
  id: string;
  name: string;
  quantity: number;
  status: 'active' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

class Equipment extends Model<EquipmentData> {
  static collectionName = 'equipments';
}

const gym = await Gym.load('gym123');

// CREATE - Add documents (fully typed)
const equipment = await gym.subcollection(Equipment).create({
  name: 'Treadmill',
  quantity: 5,
  status: 'active',
});

// READ - Query subcollections (returns EquipmentData[])
const equipments = await gym.subcollection(Equipment).get();
const activeEquipments = await gym
  .subcollection(Equipment)
  .where('status', '==', 'active')
  .get();

// FIND - Get specific document (returns EquipmentData | null)
const found = await gym.subcollection(Equipment).find('equipment123');

// UPDATE - Modify document (type-safe)
await gym.subcollection(Equipment).update('equipment123', {
  quantity: 10,
});

// DELETE - Remove document
await gym.subcollection(Equipment).destroy('equipment123');

// DELETE ALL - Remove all documents
await gym.subcollection(Equipment).deleteAll();

// String-based also works (backwards compatible)
await gym.subcollection('equipments').get();
```

### Atomic Cascade Delete

Delete documents with all subcollections in one atomic transaction:

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

### Field Value Utilities

Atomic field operations without reading documents first:

```typescript
import {
  increment,
  arrayUnion,
  arrayRemove,
  deleteField,
  serverTimestamp,
} from 'ndfirestorm';

// Atomic increment/decrement
await User.update('user123', {
  credits: increment(50), // Add 50 credits
  loginCount: increment(1), // Increment by 1
});

// Array operations (no duplicates)
await User.update('user123', {
  tags: arrayUnion('premium', 'verified'), // Add tags
  oldTags: arrayRemove('trial'), // Remove tag
});

// Server timestamp
await User.update('user123', {
  lastLoginAt: serverTimestamp(),
});

// Delete field
await User.update('user123', {
  temporaryToken: deleteField(),
});

// Combine operations
await User.update('user123', {
  credits: increment(100),
  tags: arrayUnion('vip'),
  lastLoginAt: serverTimestamp(),
});
```

### Custom IDs

Create documents with custom IDs (perfect for Firebase Auth sync):

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

### Numeric IDs

Work with numeric IDs in your code (automatically converted to strings for Firestore):

```typescript
// Define model with numeric ID
interface CityData extends ModelAttributes {
  id: number; // Use numbers in code
  name: string;
  province: string;
}

class City extends Model<CityData> {
  static collectionName = 'locations_cities';
}

// Works with all operations (numbers converted to strings internally)
const city = await City.find(12345); // → Firestore receives "12345"
await City.update(12345, { name: 'New Name' });
await City.destroy(54321);

// Batch and transactions
await City.batch(async (ctx) => {
  ctx.create(City, { name: 'Jakarta' }, 11111);
  ctx.update(City, 12345, { population: 10000000 });
});

// Subcollections
const districts = await City.subcollection(12345, 'districts').get();
```

**Note:** Firestore requires string IDs. FirestORM converts numbers to strings automatically.

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

## Real-World Examples

### React Hook

**Fetch and display user data with loading state**

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

// Usage in component
function UserProfile({ userId }: { userId: string }) {
  const { user, loading } = useUser(userId);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return <div>{user.name}</div>;
}
```

### Real-time React Hook

**Live updates with automatic cleanup**

```typescript
function useRealtimeUser(userId: string) {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const unsubscribe = User.listen(userId, (data) => {
      setUser(data);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [userId]);

  return user;
}
```

### API Route (Next.js)

**Return JSON directly from queries**

```typescript
// app/api/users/route.ts
export async function GET(request: NextRequest) {
  const users = await User.where('status', '==', 'active').get();
  return NextResponse.json(users); // Already JSON!
}

// app/api/users/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await User.find(params.id);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

// app/api/users/[id]/route.ts
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = await request.json();
  await User.update(params.id, data);

  return NextResponse.json({ success: true });
}
```

### Vue Composable

**Reusable composition function**

```typescript
// composables/useUser.ts
export function useUser(userId: Ref<string>) {
  const user = ref<UserData | null>(null);
  const loading = ref(true);

  watchEffect((onCleanup) => {
    loading.value = true;

    const unsubscribe = User.listen(userId.value, (data) => {
      user.value = data;
      loading.value = false;
    });

    onCleanup(() => unsubscribe());
  });

  return { user, loading };
}

// Usage in component
const userId = ref('user123');
const { user, loading } = useUser(userId);
```

### Pinia Store

**State management with type safety**

```typescript
// stores/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({
    users: [] as UserData[],
    currentUser: null as UserData | null,
    loading: false,
  }),

  actions: {
    async loadUsers() {
      this.loading = true;
      this.users = await User.all();
      this.loading = false;
    },

    async loadActiveUsers() {
      this.loading = true;
      this.users = await User.where('status', '==', 'active').get();
      this.loading = false;
    },

    async updateUser(id: string, data: Partial<UserData>) {
      await User.update(id, data);
      await this.loadUsers(); // Refresh list
    },

    listenToUser(userId: string) {
      return User.listen(userId, (user) => {
        this.currentUser = user;
      });
    },
  },
});
```

### Express.js API

**RESTful API endpoints**

```typescript
// routes/users.ts
import express from 'express';
import { User } from '../models/User';

const router = express.Router();

// GET /users
router.get('/', async (req, res) => {
  const users = await User.all();
  res.json(users);
});

// GET /users/:id
router.get('/:id', async (req, res) => {
  const user = await User.find(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// POST /users
router.post('/', async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user.toJSON());
});

// PATCH /users/:id
router.patch('/:id', async (req, res) => {
  await User.update(req.params.id, req.body);
  const user = await User.find(req.params.id);
  res.json(user);
});

// DELETE /users/:id
router.delete('/:id', async (req, res) => {
  await User.destroy(req.params.id);
  res.status(204).send();
});

export default router;
```

### Firebase Auth Integration

**Sync user documents with Firebase Auth**

```typescript
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const auth = getAuth();

onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    // Create or update user document with Auth UID
    const existingUser = await User.find(firebaseUser.uid);

    if (!existingUser) {
      // Create new user with Auth UID as document ID
      await User.create(
        {
          name: firebaseUser.displayName || 'Anonymous',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || '',
          emailVerified: firebaseUser.emailVerified,
        },
        firebaseUser.uid // Use Auth UID as document ID
      );
    } else {
      // Update existing user
      await User.update(firebaseUser.uid, {
        emailVerified: firebaseUser.emailVerified,
        photoURL: firebaseUser.photoURL || '',
      });
    }
  }
});
```

📚 **[More Examples](./examples/README.md)** - See the `examples/` directory for complete, runnable examples

## Comparison with Other ORMs

| Feature        | NDFirestORM      | Fireorm       | Typesaurus    |
| -------------- | ---------------- | ------------- | ------------- |
| TypeScript     | ✅ First-class   | ✅ Yes        | ✅ Yes        |
| JSON First     | ✅ Default       | ❌ Always ORM | ❌ Always ORM |
| ID in Object   | ✅ Auto-included | ⚠️ Separate   | ⚠️ Separate   |
| Pagination     | ✅ 3 types       | ⚠️ Basic      | ⚠️ Basic      |
| Type Utilities | ✅ Full helpers  | ⚠️ Basic      | ⚠️ Basic      |

## What Makes NDFirestORM Different?

### 1. JSON First, ORM When Needed

Most ORMs force you to work with class instances. NDFirestORM returns plain JSON by default (faster, API-ready), but gives you model instances when you need them:

```typescript
// Reading? Get JSON (fast, API-ready)
const users = await User.all(); // UserData[]

// Updating? Get model instance (with helper methods)
const user = await User.load('id');
await user?.update({ name: 'New Name' });
```

### 2. ID Always Included

No more manually adding document IDs to your data:

```typescript
// ❌ Other ORMs
const user = { ...doc.data(), id: doc.id };

// ✅ NDFirestORM
const user = await User.find('id'); // { id: 'id', name: '...', ... }
```

### 3. Cost Optimization Built-in

Reduce Firestore operations with smart patterns:

```typescript
// Update without reading first (1 operation instead of 2)
await User.update('id', { name: 'Jane' });

// Batch operations by ID (saves 50% of operations)
await User.batch(async (ctx) => {
  ctx.update(User, 'user1', { status: 'active' });
  ctx.update(User, 'user2', { status: 'active' });
});
```

### 4. Real-time Made Simple

```typescript
// Live updates with one line
User.listen('user-id', (user) => {
  console.log('User updated:', user); // Already JSON!
});
```

## Performance

NDFirestORM is designed for performance:

- **Zero overhead** - No unnecessary class instantiation
- **JSON first** - Returns plain objects (faster than class instances)
- **Smart caching** - Reuses collection references
- **Batch operations** - Efficient bulk writes
- **Cost optimized** - Built-in patterns to reduce Firestore operations

## TypeScript Support

Full type safety with intelligent autocomplete:

```typescript
// ✅ Fully typed results
const users = await User.where('age', '>=', 18).get(); // UserData[]

// ✅ Type-safe updates
await User.update('id', {
  name: 'Jane', // ✅ Valid
  invalidField: 'value', // ❌ TypeScript error
});

// ✅ Type utilities
type CreateUserInput = CreateModelData<User>; // Without id, timestamps
type UpdateUserInput = UpdateModelData<User>; // Partial, without id
```

## Community & Support

- 📖 [Documentation](./docs/README.md)
- 🐛 [Issue Tracker](https://github.com/nelsondiego/FirestORM/issues)
- 💬 [Discussions](https://github.com/nelsondiego/FirestORM/discussions)
- 📦 [NPM Package](https://www.npmjs.com/package/ndfirestorm)

## Roadmap

- [ ] Relationships (hasMany, belongsTo, etc.)
- [ ] Model events and hooks
- [ ] Query caching
- [ ] Soft deletes support
- [ ] Migration tools
- [ ] CLI for model generation

## License

MIT © Diego Nelson

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Star History

If you find NDFirestORM useful, please consider giving it a ⭐ on GitHub!
