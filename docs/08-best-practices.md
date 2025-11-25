# Best Practices & Tips

## 🎯 General Principles

### 1. Zero Firestore Code

**Always work with models, never with Firestore directly:**

```typescript
// ❌ Bad - Using Firestore directly
import { doc, getDoc, updateDoc } from 'firebase/firestore';
const userRef = doc(firestore, 'users', 'user123');
const userSnap = await getDoc(userRef);
await updateDoc(userRef, { name: 'New Name' });

// ✅ Good - Using the ORM
const user = await User.load('user123');
await user?.update({ name: 'New Name' });
```

### 2. Use the Right Method for the Job

```typescript
// ✅ Use find() for reading JSON data
const user = await User.find('user123');
console.log(user?.name);

// ✅ Use load() for updates/deletes
const user = await User.load('user123');
await user?.update({ name: 'New Name' });

// ✅ Use create() for new records
const user = await User.create({ name: 'John', email: 'john@example.com' });
```

## 📖 CRUD Operations

### Creating Records

```typescript
// ✅ Simple create
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
});

// ✅ Create with custom ID (for Auth sync)
const user = await User.create(
  {
    name: 'John Doe',
    email: 'john@example.com',
  },
  firebaseUser.uid
);

// ✅ Create and use immediately
const user = await User.create({ name: 'John', email: 'john@example.com' });
await user.update({ emailVerified: true }); // Can use right away
```

### Reading Records

```typescript
// ✅ Single record
const user = await User.find('user123');

// ✅ With null check
const user = await User.find('user123');
if (user) {
  console.log(user.name);
}

// ✅ Or throw error if not found
const user = await User.findOrFail('user123');

// ✅ Query multiple records
const activeUsers = await User.where('status', '==', 'active').get();

// ✅ Get all records
const allUsers = await User.all();
```

### Updating Records

```typescript
// ✅ Update by ID (fastest, recommended for simple updates)
await User.update('user123', { name: 'New Name' });

// ✅ Load and update (for validation or hooks)
const user = await User.load('user123');
await user?.update({ name: 'New Name' });

// ✅ With optional chaining
const user = await User.load('user123');
await user?.update({ name: 'New Name' });

// ✅ Check before updating
const user = await User.load('user123');
if (user) {
  await user.update({ name: 'New Name' });
}

// ❌ Bad - Loading when not needed
const user = await User.load('user123');
await user?.update({ name: 'New Name' }); // Just use User.update() instead

// ✅ Good - Use static update for simple changes
await User.update('user123', { name: 'New Name' });
```

### Deleting Records

```typescript
// ✅ Delete by ID (fastest, no need to load)
await User.destroy('user123');

// ✅ Load and delete (for soft deletes or hooks)
const user = await User.load('user123');
await user?.delete();

// ✅ Batch delete (most efficient for multiple documents)
await User.where('status', '==', 'inactive').deleteAll();

// ✅ Manual loop delete (when you need control)
const inactiveUsers = await User.where('status', '==', 'inactive').get();
for (const userData of inactiveUsers) {
  await User.destroy(userData.id);
}

// ❌ Bad - Loading when not needed
const user = await User.load('user123');
await user?.delete(); // Just use destroy() instead

// ✅ Good - Use destroy() for simple deletes
await User.destroy('user123');
```

## 🔄 Transactions

### When to Use Transactions

Use transactions when you need **atomic operations** across multiple documents:

```typescript
// ✅ Good use case: Transfer credits
await User.transaction(async (ctx) => {
  const fromUser = await User.load('user1');
  const toUser = await User.load('user2');

  if (!fromUser || !toUser) {
    throw new Error('Users not found');
  }

  if (fromUser.get('credits') < 100) {
    throw new Error('Insufficient credits');
  }

  await ctx.update(fromUser, { credits: fromUser.get('credits') - 100 });
  await ctx.update(toUser, { credits: toUser.get('credits') + 100 });
});
```

### Transaction Best Practices

```typescript
// ✅ Load all data first
await User.transaction(async (ctx) => {
  // Load everything you need
  const user = await User.load('user1');
  const gym = await Gym.load('gym1');
  const order = await Order.load('order1');

  // Then make changes
  if (user && gym && order) {
    await ctx.update(user, { gymId: gym.id });
    await ctx.update(gym, { memberCount: gym.get('memberCount') + 1 });
    await ctx.update(order, { status: 'completed' });
  }
});

// ❌ Bad - Loading inside loops
await User.transaction(async (ctx) => {
  for (const id of userIds) {
    const user = await User.load(id); // Slow!
    await ctx.update(user, { status: 'active' });
  }
});

// ✅ Good - Load all first
await User.transaction(async (ctx) => {
  const users = await Promise.all(userIds.map((id) => User.load(id)));

  for (const user of users) {
    if (user) {
      await ctx.update(user, { status: 'active' });
    }
  }
});
```

### Error Handling in Transactions

```typescript
// ✅ Always wrap in try/catch
try {
  await User.transaction(async (ctx) => {
    // Your transaction logic
    const user = await User.load('user1');
    if (!user) {
      throw new Error('User not found');
    }

    await ctx.update(user, { credits: user.get('credits') + 100 });
  });

  console.log('Transaction successful');
} catch (error) {
  console.error('Transaction failed:', error);
  // Handle rollback scenario
  // All changes are automatically rolled back
}
```

## 📦 Batch Operations

### When to Use Batch

Use batch operations for **bulk writes** that don't need to be atomic:

```typescript
// ✅ Good use case: Bulk updates
await User.batch(async (ctx) => {
  const users = await User.where('status', '==', 'pending').get();

  for (const userData of users) {
    const user = await User.load(userData.id);
    if (user) {
      ctx.update(user, { status: 'active' });
    }
  }
});
```

### Important: Batch Operations and Billing

**⚠️ Batch operations do NOT reduce Firestore costs:**

- Each operation in a batch counts as a separate billable operation
- 100 writes in a batch = 100 write operations charged
- **Benefits of batch:**
  - ✅ Better network performance (single HTTP request)
  - ✅ Atomic execution (all succeed or all fail)
  - ✅ Faster than sequential operations
  - ❌ Does NOT reduce costs

```typescript
// These cost the same in terms of Firestore operations:

// Option 1: Sequential (slower, same cost)
for (const id of userIds) {
  await User.update(id, { status: 'active' }); // 100 operations
}

// Option 2: Batch (faster, same cost)
await User.batch(async (ctx) => {
  for (const id of userIds) {
    const user = await User.load(id);
    if (user) ctx.update(user, { status: 'active' }); // Still 100 operations
  }
});

// Both charge for 100 write operations
```

### Batch Best Practices

```typescript
// ✅ Respect the 500 operation limit
async function bulkUpdate(userIds: string[]) {
  const BATCH_SIZE = 500;

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batchIds = userIds.slice(i, i + BATCH_SIZE);

    await User.batch(async (ctx) => {
      for (const id of batchIds) {
        // Update by ID (no need to load)
        ctx.update(User, id, { status: 'active' });
      }
    });
  }
}

// ⚠️ Cost consideration: Use ID-based methods when possible
// These have the same cost but different performance:

// ❌ Slower: Load each document (2 operations per user: 1 read + 1 write)
await User.batch(async (ctx) => {
  for (const id of userIds) {
    const user = await User.load(id); // Read operation
    if (user) ctx.update(user, { status: 'active' }); // Write operation
  }
});

// ✅ Faster: Update by ID (1 operation per user: 1 write only)
await User.batch(async (ctx) => {
  for (const id of userIds) {
    ctx.update(User, id, { status: 'active' }); // Write operation only
  }
});

// ✅ Also good: Delete by ID
await User.batch(async (ctx) => {
  for (const id of userIds) {
    ctx.delete(User, id); // Delete operation only
  }
});

// ✅ Load models before batch
const users = await User.where('status', '==', 'inactive').get();

await User.batch(async (ctx) => {
  for (const userData of users) {
    const user = await User.load(userData.id);
    if (user) {
      ctx.delete(user);
    }
  }
});
```

## 🔴 Real-time Subscriptions

### When to Use Listen

Use `listen()` for **real-time UI updates**:

```typescript
// ✅ Good use case: Live dashboard (single document)
const unsubscribe = User.listen('user123', (user) => {
  if (user) {
    updateUI(user); // Already JSON!
  }
});

// ✅ Good use case: Live list (query results)
const unsubscribe = User.where('status', '==', 'active').listen((users) => {
  updateUserList(users); // Already JSON array!
});

// ❌ Bad - Using for one-time reads
const unsubscribe = User.listen('user123', (user) => {
  console.log(user);
  unsubscribe(); // Don't do this
});

// ✅ Good - Use find() for one-time reads
const user = await User.find('user123');
console.log(user);

// ✅ Good - Use get() for one-time query
const users = await User.where('status', '==', 'active').get();
console.log(users);
```

### Subscription Best Practices

```typescript
// ✅ Always cleanup subscriptions (single document)
function UserComponent({ userId }) {
  useEffect(() => {
    const unsubscribe = User.listen(userId, (user) => {
      setUser(user);
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, [userId]);
}

// ✅ Always cleanup subscriptions (query)
function AdminListComponent() {
  useEffect(() => {
    const unsubscribe = User.where('role', '==', 'admin').listen((admins) => {
      setAdmins(admins);
    });

    return () => unsubscribe();
  }, []);
}

// ✅ Handle null/deleted documents
User.listen('user123', (user) => {
  if (user) {
    console.log('User exists:', user); // Already JSON!
  } else {
    console.log('User deleted or does not exist');
  }
});

// ✅ Handle empty query results
User.where('status', '==', 'inactive').listen((users) => {
  if (users.length === 0) {
    console.log('No inactive users');
  } else {
    console.log('Inactive users:', users);
  }
});

// ✅ Multiple subscriptions
const unsubscribes: Unsubscribe[] = [];

userIds.forEach((id) => {
  const unsub = User.listen(id, (user) => {
    updateUserInList(id, user); // Already JSON!
  });
  unsubscribes.push(unsub);
});

// Cleanup all
unsubscribes.forEach((unsub) => unsub());
```

## 🎨 Model Design

### Define Clear Interfaces

```typescript
// ✅ Good - Clear, typed interface
interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'banned';
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

class User extends Model<UserData> {
  static collectionName = 'users';
}

// ❌ Bad - Using any
class User extends Model<any> {
  static collectionName = 'users';
}
```

### Add Custom Methods

```typescript
// ✅ Add scopes for common queries
class User extends Model<UserData> {
  static collectionName = 'users';

  static active() {
    return this.where('status', '==', 'active');
  }

  static admins() {
    return this.where('role', '==', 'admin');
  }
}

// Usage
const activeUsers = await User.active().get();
const admins = await User.admins().get();

// ✅ Add instance methods
class User extends Model<UserData> {
  static collectionName = 'users';

  async activate() {
    await this.update({ status: 'active' });
  }

  async addCredits(amount: number) {
    await this.update({ credits: this.get('credits') + amount });
  }

  isAdmin(): boolean {
    return this.get('role') === 'admin';
  }
}

// Usage
const user = await User.load('user123');
if (user) {
  await user.activate();
  await user.addCredits(100);
  console.log('Is admin:', user.isAdmin());
}
```

## 🔍 Querying

### Efficient Queries

```typescript
// ✅ Use indexes for complex queries
const users = await User.where('status', '==', 'active')
  .where('role', '==', 'admin')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();

// ✅ Use pagination for large datasets
const result = await User.where('status', '==', 'active').paginate({
  perPage: 50,
  page: 1,
});

// ❌ Bad - Loading all records
const allUsers = await User.all(); // Could be thousands!

// ✅ Good - Use pagination or limits
const users = await User.limit(100).get();
```

### Query Patterns

```typescript
// ✅ Reusable query scopes
class User extends Model<UserData> {
  static collectionName = 'users';

  static active() {
    return this.where('status', '==', 'active');
  }

  static byRole(role: string) {
    return this.where('role', '==', role);
  }

  static recent(days: number = 7) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.where('createdAt', '>=', date);
  }
}

// Usage
const recentAdmins = await User.active().byRole('admin').recent(30).get();
```

## 🆔 Custom IDs

### When to Use Custom IDs

```typescript
// ✅ Good use case: Firebase Auth sync
const auth = getAuth();
const firebaseUser = auth.currentUser;

if (firebaseUser) {
  const user = await User.create(
    {
      name: firebaseUser.displayName || 'Anonymous',
      email: firebaseUser.email || '',
    },
    firebaseUser.uid // Use Auth UID as document ID
  );
}

// ✅ Good use case: Predictable IDs
const gym = await Gym.create(
  {
    name: 'Main Gym',
    location: 'Downtown',
  },
  'main-gym' // Easy to reference
);

// ❌ Bad - Random custom IDs
const user = await User.create(
  { name: 'John' },
  Math.random().toString() // Use auto-generated IDs instead
);
```

## 🧪 Testing

### Mock Models for Testing

```typescript
// ✅ Easy to mock
jest.mock('@/models/User');

test('should process order', async () => {
  const mockUser = {
    id: 'user123',
    credits: 100,
    get: jest.fn((key) => mockUser[key]),
  };

  User.load = jest.fn().mockResolvedValue(mockUser);

  // Test your logic
  const result = await processOrder('order123', 'user123');
  expect(result.success).toBe(true);
});
```

## 🚀 Performance

### Optimize Reads

```typescript
// ✅ Use find() for single reads (returns JSON)
const user = await User.find('user123');

// ❌ Bad - Using load() when you don't need instance
const user = await User.load('user123');
const name = user?.get('name'); // Unnecessary overhead

// ✅ Good - Use find() for reading
const user = await User.find('user123');
const name = user?.name; // Direct access
```

### Batch Reads

```typescript
// ❌ Bad - Sequential reads
for (const id of userIds) {
  const user = await User.find(id); // Slow!
  console.log(user);
}

// ✅ Good - Parallel reads
const users = await Promise.all(userIds.map((id) => User.find(id)));
users.forEach((user) => console.log(user));
```

### Use Pagination

```typescript
// ❌ Bad - Loading everything
const allOrders = await Order.all(); // Could be millions!

// ✅ Good - Use pagination
const result = await Order.orderBy('createdAt', 'desc').paginate({
  perPage: 50,
  page: 1,
});
```

## 🔒 Security

### Validate Data

```typescript
// ✅ Validate before creating
async function createUser(data: any) {
  if (!data.email || !isValidEmail(data.email)) {
    throw new Error('Invalid email');
  }

  if (!data.name || data.name.length < 2) {
    throw new Error('Name too short');
  }

  return User.create(data);
}

// ✅ Validate in transactions
await User.transaction(async (ctx) => {
  const user = await User.load('user1');
  if (!user) {
    throw new Error('User not found');
  }

  if (user.get('credits') < 100) {
    throw new Error('Insufficient credits');
  }

  await ctx.update(user, { credits: user.get('credits') - 100 });
});
```

## 📝 Code Organization

### Folder Structure

```
src/
├── models/
│   ├── index.ts          # Export all models
│   ├── User.ts
│   ├── Gym.ts
│   ├── Order.ts
│   └── types/
│       └── common.ts     # Shared types
├── services/
│   ├── userService.ts    # Business logic
│   ├── gymService.ts
│   └── orderService.ts
└── utils/
    └── orm.ts            # ORM initialization
```

### Export Pattern

```typescript
// models/index.ts
export { User, type UserData } from './User';
export { Gym, type GymData } from './Gym';
export { Order, type OrderData } from './Order';

// Usage
import { User, type UserData } from '@/models';
```

## 🎯 Common Patterns

### Service Layer

```typescript
// services/userService.ts
import { User, type UserData } from '@/models';

export class UserService {
  static async createUser(
    data: Omit<UserData, 'id' | 'createdAt' | 'updatedAt'>
  ) {
    return User.create(data);
  }

  static async getActiveUsers(): Promise<UserData[]> {
    return User.where('status', '==', 'active').get();
  }

  static async deactivateUser(userId: string): Promise<void> {
    const user = await User.load(userId);
    await user?.update({ status: 'inactive' });
  }
}
```

### Repository Pattern

```typescript
// repositories/UserRepository.ts
import { User, type UserData } from '@/models';

export class UserRepository {
  async findById(id: string): Promise<UserData | null> {
    return User.find(id);
  }

  async findByEmail(email: string): Promise<UserData | null> {
    return User.where('email', '==', email).first();
  }

  async create(data: Partial<UserData>): Promise<UserData> {
    const user = await User.create(data);
    return user.toJSON();
  }

  async update(id: string, data: Partial<UserData>): Promise<void> {
    const user = await User.load(id);
    await user?.update(data);
  }
}
```

## 🔗 Related Documentation

- [Getting Started](./01-getting-started.md)
- [CRUD Operations](./04-crud-operations.md)
- [Transactions & Real-time](./07-realtime-transactions.md)
- [Type Utilities](./06-type-utilities.md)
