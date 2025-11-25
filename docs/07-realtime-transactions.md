# Real-time Subscriptions, Transactions & Batch Operations

## 🎯 Philosophy

**Zero Firestore Code**: This ORM completely abstracts Firestore. You work only with models - no `doc()`, `collection()`, `getDoc()`, or any Firestore functions in your application code.

## 🔴 Real-time Subscriptions (Listen)

Subscribe to real-time updates for a document.

### Basic Usage

```typescript
import { User, type UserData, type Unsubscribe } from 'ndfirestorm';

// Listen to a single document (receives JSON)
const unsubscribe: Unsubscribe = User.listen(
  'user123',
  (user: UserData | null) => {
    if (user) {
      console.log('User updated:', user);
      console.log('Name:', user.name);
    } else {
      console.log('User deleted or does not exist');
    }
  }
);

// Stop listening when done
unsubscribe();
```

### Listen to Query Results

```typescript
// Listen to all admins in real-time
const unsubscribe = User.where('role', '==', 'admin').listen((admins) => {
  console.log('Admins updated:', admins);
  console.log('Total admins:', admins.length);
});

// Listen to active users
const unsubscribe = User.where('status', '==', 'active')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .listen((users) => {
    console.log('Latest 10 active users:', users);
  });

// Stop listening
unsubscribe();
```

### React Hook Examples

#### Single Document

```typescript
import { useState, useEffect } from 'react';
import { User, type UserData, type Unsubscribe } from 'ndfirestorm';

function useUser(userId: string) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = User.listen(userId, (userData) => {
      setUser(userData); // Already JSON!
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [userId]);

  return { user, loading };
}

// Usage in component
function UserProfile({ userId }: { userId: string }) {
  const { user, loading } = useUser(userId);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

#### Query Results

```typescript
function useAdmins() {
  const [admins, setAdmins] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = User.where('role', '==', 'admin')
      .orderBy('name', 'asc')
      .listen((adminUsers) => {
        setAdmins(adminUsers);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  return { admins, loading };
}

// Usage
function AdminList() {
  const { admins, loading } = useAdmins();

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {admins.map((admin) => (
        <li key={admin.id}>{admin.name}</li>
      ))}
    </ul>
  );
}
```

## 🔄 Transactions

Run atomic operations across multiple documents and models. **No Firestore code needed!**

### Basic Transaction

```typescript
import { User } from 'ndfirestorm';

// Transfer credits between users
await User.transaction(async (ctx) => {
  // Load both users
  const user1 = await User.load('user1');
  const user2 = await User.load('user2');

  if (!user1 || !user2) {
    throw new Error('Users not found');
  }

  // Check if user1 has enough credits
  if (user1.get('credits') < 100) {
    throw new Error('Insufficient credits');
  }

  // Update both users atomically
  await ctx.update(user1, { credits: user1.get('credits') - 100 });
  await ctx.update(user2, { credits: user2.get('credits') + 100 });
});

console.log('Transaction completed successfully');
```

### Transaction Across Multiple Models

Transactions work across different models. If any operation fails, all changes are rolled back:

```typescript
import { User, Gym } from 'ndfirestorm';

// Update user and gym atomically
await User.transaction(async (ctx) => {
  // Load both models
  const user = await User.load('user123');
  const gym = await Gym.load('gym456');

  if (!user || !gym) {
    throw new Error('User or Gym not found');
  }

  // Check if user can join gym
  if (gym.get('memberCount') >= gym.get('maxMembers')) {
    throw new Error('Gym is full');
  }

  if (user.get('credits') < gym.get('membershipFee')) {
    throw new Error('Insufficient credits');
  }

  // Update both atomically - if one fails, both rollback
  await ctx.update(user, {
    credits: user.get('credits') - gym.get('membershipFee'),
    gymId: gym.id,
    memberSince: new Date(),
  });

  await ctx.update(gym, {
    memberCount: gym.get('memberCount') + 1,
    memberIds: [...(gym.get('memberIds') || []), user.id],
  });
});

console.log('User joined gym successfully');
```

**Important**:

- You can call the transaction from any Model class (User, Gym, Order, etc.)
- The transaction works across all collections
- **No Firestore code needed** - just work with your models!

```typescript
// All of these are equivalent:
await User.transaction(async (ctx) => {
  /* ... */
});
await Gym.transaction(async (ctx) => {
  /* ... */
});
await Order.transaction(async (ctx) => {
  /* ... */
});
```

### Transaction with Create and Delete

```typescript
await User.transaction(async (ctx) => {
  // Create a new user
  const newUser = await ctx.create(User, {
    name: 'New User',
    email: 'new@example.com',
    credits: 0,
  });

  // Load existing user
  const oldUser = await User.load('old-user-id');

  if (oldUser) {
    // Transfer data
    await ctx.update(newUser, { credits: oldUser.get('credits') });

    // Delete old user
    await ctx.delete(oldUser);
  }
});
```

### Transaction with Return Value

```typescript
interface TransferResult {
  success: boolean;
  fromBalance: number;
  toBalance: number;
}

const result = await User.transaction<TransferResult>(async (ctx) => {
  const fromUser = await User.load('user1');
  const toUser = await User.load('user2');

  if (!fromUser || !toUser) {
    throw new Error('Users not found');
  }

  const amount = 50;

  if (fromUser.get('credits') < amount) {
    throw new Error('Insufficient funds');
  }

  const newFromBalance = fromUser.get('credits') - amount;
  const newToBalance = toUser.get('credits') + amount;

  await ctx.update(fromUser, { credits: newFromBalance });
  await ctx.update(toUser, { credits: newToBalance });

  return {
    success: true,
    fromBalance: newFromBalance,
    toBalance: newToBalance,
  };
});

console.log('Transfer result:', result);
```

### Transaction with Subcollections (NEW!)

Delete subcollections atomically within transactions:

```typescript
// Delete document with all its subcollections atomically
await Gym.transaction(async (ctx) => {
  const gym = await Gym.load('gym123');
  if (!gym) throw new Error('Gym not found');

  // Delete subcollections within transaction
  await ctx.deleteSubcollection(gym, 'equipments');
  await ctx.deleteSubcollection(gym, 'members');
  await ctx.deleteSubcollection(gym, 'features');

  // Delete parent document
  await ctx.delete(gym);
});

console.log('Gym and all subcollections deleted atomically!');
```

### Cascade Delete Helper

Use `deleteCascade()` for cleaner code:

```typescript
// Automatically delete subcollections with parent
await Gym.transaction(async (ctx) => {
  const gym = await Gym.load('gym123');
  if (!gym) throw new Error('Gym not found');

  // Delete gym and all subcollections in one call
  await ctx.deleteCascade(gym, {
    subcollections: ['equipments', 'members', 'features'],
  });
});
```

### Complete Atomic Deletion Example

Delete a document with subcollections and related data - all atomically:

```typescript
async function deleteGymAtomically(gymId: string) {
  await Gym.transaction(async (ctx) => {
    const gym = await Gym.load(gymId);
    if (!gym) throw new Error('Gym not found');

    // Delete gym with all subcollections and related data
    await ctx.deleteCascade(gym, {
      subcollections: ['equipments', 'members', 'features'],
      onBeforeDelete: async () => {
        // Delete related collections
        const staff = await GymStaff.where('gymId', '==', gymId).get();
        for (const s of staff) {
          const staffModel = await GymStaff.load(s.id);
          if (staffModel) await ctx.delete(staffModel);
        }

        // Update user references
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
      },
    });
  });

  console.log('✅ Complete atomic deletion successful!');
}

// Usage
await deleteGymAtomically('gym123');
```

## 📦 Batch Operations

Perform bulk writes efficiently (up to 500 operations). **No Firestore code needed!**

### Basic Batch

```typescript
import { User } from 'ndfirestorm';

// Update multiple users at once
await User.batch(async (ctx) => {
  // Option 1: Update by ID (faster, no loading needed)
  ctx.update(User, 'user1', { status: 'active' });
  ctx.update(User, 'user2', { status: 'active' });
  ctx.update(User, 'user3', { status: 'active' });
});

// Or with model instances (if you need validation)
await User.batch(async (ctx) => {
  const user1 = await User.load('user1');
  const user2 = await User.load('user2');
  const user3 = await User.load('user3');

  if (user1) ctx.update(user1, { status: 'active' });
  if (user2) ctx.update(user2, { status: 'active' });
  if (user3) ctx.update(user3, { status: 'active' });
});

console.log('Batch update completed');
```

### Batch Create Multiple Documents

```typescript
// Create multiple users in a batch
await User.batch(async (ctx) => {
  ctx.create(User, { name: 'John', email: 'john@example.com', credits: 100 });
  ctx.create(User, { name: 'Jane', email: 'jane@example.com', credits: 100 });
  ctx.create(User, { name: 'Bob', email: 'bob@example.com', credits: 100 });
});
```

### Batch Delete Multiple Documents

```typescript
// Delete inactive users
const inactiveUsers = await User.where('status', '==', 'inactive').get();

// Option 1: Delete by ID (faster, recommended)
await User.batch(async (ctx) => {
  for (const userData of inactiveUsers) {
    ctx.delete(User, userData.id);
  }
});

// Option 2: Load and delete (if you need hooks)
await User.batch(async (ctx) => {
  for (const userData of inactiveUsers) {
    const user = await User.load(userData.id);
    if (user) {
      ctx.delete(user);
    }
  }
});

// Option 3: Use deleteAll() for simplicity
await User.where('status', '==', 'inactive').deleteAll();

console.log(`Deleted ${inactiveUsers.length} inactive users`);
```

### Mixed Batch Operations

```typescript
// Create, update, and delete in one batch
await User.batch(async (ctx) => {
  // Create new user
  ctx.create(User, {
    name: 'New User',
    email: 'new@example.com',
    credits: 100,
    status: 'active',
  });

  // Update existing user
  const user = await User.load('user123');
  if (user) {
    ctx.update(user, { lastLogin: new Date() });
  }

  // Delete old user
  const oldUser = await User.load('oldUser');
  if (oldUser) {
    ctx.delete(oldUser);
  }
});
```

## 🆔 Custom IDs

Create documents with custom IDs instead of auto-generated ones.

### Create with Custom ID

```typescript
// Method 1: Pass custom ID to create()
const user = await User.create(
  {
    name: 'John Doe',
    email: 'john@example.com',
  },
  'my-custom-id' // Custom ID
);

console.log(user.id); // 'my-custom-id'
```

### Sync with Firebase Auth

```typescript
import { getAuth } from 'firebase/auth';

// Create user document with same ID as Firebase Auth
const auth = getAuth();
const firebaseUser = auth.currentUser;

if (firebaseUser) {
  const user = await User.create(
    {
      name: firebaseUser.displayName || 'Anonymous',
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || '',
    },
    firebaseUser.uid // Use Firebase Auth UID
  );

  console.log('User created with Auth UID:', user.id);
}
```

### Custom ID in Transaction

```typescript
await User.transaction(async (ctx) => {
  // Create with custom ID in transaction
  const user = await ctx.create(
    User,
    { name: 'John', email: 'john@example.com' },
    'custom-id-123'
  );

  console.log('Created user with ID:', user.id);
});
```

## 🎯 Complete Examples

### Order Processing with Transaction

```typescript
async function processOrder(orderId: string, userId: string) {
  return Order.transaction(async (ctx) => {
    // Load order and user
    const order = await Order.load(orderId);
    const user = await User.load(userId);

    if (!order || !user) {
      throw new Error('Order or user not found');
    }

    // Check if user has enough credits
    if (user.get('credits') < order.get('total')) {
      throw new Error('Insufficient credits');
    }

    // Update order status
    await ctx.update(order, {
      status: 'processing',
      processedAt: new Date(),
    });

    // Deduct credits from user
    await ctx.update(user, {
      credits: user.get('credits') - order.get('total'),
    });

    // Create transaction record
    await ctx.create(Transaction, {
      type: 'order',
      orderId: order.id,
      userId: user.id,
      amount: order.get('total'),
      timestamp: new Date(),
    });

    return {
      success: true,
      remainingCredits: user.get('credits') - order.get('total'),
    };
  });
}
```

### Bulk User Import with Batch

```typescript
async function importUsers(users: Array<{ name: string; email: string }>) {
  const BATCH_SIZE = 500; // Firestore limit

  // Split into batches of 500
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batchUsers = users.slice(i, i + BATCH_SIZE);

    await User.batch(async (ctx) => {
      batchUsers.forEach((userData) => {
        ctx.create(User, {
          ...userData,
          status: 'active',
          credits: 0,
        });
      });
    });
  }

  console.log(`Imported ${users.length} users`);
}

// Usage
const users = [
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' },
  // ... up to thousands of users
];

await importUsers(users);
```

## 💡 Best Practices

### Transactions

1. **Keep them short** - Transactions can fail and retry
2. **Load models first** - Get all data before making changes
3. **Don't modify external state** - Transaction can run multiple times
4. **Use for atomic operations** - When consistency is critical
5. **Handle errors** - Always wrap in try/catch
6. **Watch the 500 doc limit** - Transactions can't exceed 500 documents

```typescript
try {
  await User.transaction(async (ctx) => {
    // Your transaction logic
  });
} catch (error) {
  console.error('Transaction failed:', error);
  // Handle rollback scenario
}
```

### Subcollection Deletions

1. **Use `deleteCascade()` for < 500 docs** - Atomic and clean
2. **Use `deleteAll()` for > 500 docs** - Batch-based, more efficient
3. **Combine both for mixed scenarios** - Atomic for critical, batch for large

```typescript
// ✅ Good - Under 500 documents, fully atomic
await Gym.transaction(async (ctx) => {
  const gym = await Gym.load('gym123');
  if (gym) {
    await ctx.deleteCascade(gym, {
      subcollections: ['equipments', 'members'],
    });
  }
});

// ✅ Good - Over 500 documents, use batch
const count = await Gym.subcollection('gym123', 'equipments').deleteAll();
console.log(`Deleted ${count} equipment items`);

// ❌ Bad - Will fail if > 500 documents
await Gym.transaction(async (ctx) => {
  const gym = await Gym.load('gym123');
  if (gym) {
    await ctx.deleteSubcollection(gym, 'equipments'); // 1000+ docs!
  }
});
```

### Batch Operations

1. **Limit to 500 operations** - Firestore's hard limit
2. **Use for bulk operations** - Better network performance than individual writes
3. **Split large batches** - Process in chunks if > 500 operations
4. **No reads in batch** - Load models before the batch
5. **⚠️ Same cost as individual operations** - Each operation in batch is billed separately

**Important**: Batch operations do NOT reduce Firestore costs. A batch with 100 writes = 100 billable write operations. The benefit is better performance (single network request) and atomicity (all succeed or all fail), not reduced costs.

### Real-time Subscriptions

1. **Always unsubscribe** - Prevent memory leaks
2. **Use in components** - Perfect for UI that needs live updates
3. **Handle null** - Document might not exist or be deleted
4. **Cleanup on unmount** - In React/Vue components

### Custom IDs

1. **Use for Auth sync** - Keep user doc ID same as Auth UID
2. **Use for predictable IDs** - When you need to reference before creation
3. **Validate ID format** - Ensure IDs meet Firestore requirements
4. **Avoid conflicts** - Make sure custom IDs are unique

## 💰 Cost Optimization

### Understanding Firestore Billing

Firestore charges per operation:

- **Read**: Each document read (including queries)
- **Write**: Each document create/update
- **Delete**: Each document delete

### Batch vs Individual Operations

```typescript
// ❌ Common misconception: "Batch reduces costs"
// Reality: Same cost, better performance

// Individual operations (100 writes)
for (const id of userIds) {
  await User.update(id, { status: 'active' }); // 100 write operations
}

// Batch operations (still 100 writes)
await User.batch(async (ctx) => {
  for (const id of userIds) {
    const user = await User.load(id);
    if (user) ctx.update(user, { status: 'active' }); // 100 write operations
  }
});

// Both cost the same: 100 write operations
// Batch is faster due to single network request
```

### Cost-Effective Patterns

```typescript
// ✅ Use static methods to avoid unnecessary reads
// Bad: Load + Update (2 operations per document)
const user = await User.load('user123'); // 1 read
await user?.update({ status: 'active' }); // 1 write
// Total: 2 operations

// Good: Update directly (1 operation per document)
await User.update('user123', { status: 'active' }); // 1 write only
// Total: 1 operation

// ✅ Use deleteAll() for batch deletes
// Bad: Query + Loop (N reads + N deletes)
const users = await User.where('status', '==', 'inactive').get(); // N reads
for (const user of users) {
  await User.destroy(user.id); // N deletes
}
// Total: 2N operations

// Good: deleteAll() (N reads + N deletes, but optimized)
await User.where('status', '==', 'inactive').deleteAll(); // N reads + N deletes
// Total: 2N operations (but faster execution)
```

### When to Use Each Method

| Method                   | Operations          | Use When                            |
| ------------------------ | ------------------- | ----------------------------------- |
| `Model.update(id, data)` | 1 write             | Simple update, no validation needed |
| `model.update(data)`     | 1 read + 1 write    | Need validation or current values   |
| `Model.destroy(id)`      | 1 delete            | Simple delete, no hooks             |
| `model.delete()`         | 1 read + 1 delete   | Need soft delete or hooks           |
| `query.deleteAll()`      | N reads + N deletes | Batch delete matching query         |

## 🚫 What You DON'T Need

With this ORM, you never need to use:

- ❌ `doc(firestore, 'collection', 'id')`
- ❌ `collection(firestore, 'collection')`
- ❌ `getDoc()`, `setDoc()`, `updateDoc()`, `deleteDoc()`
- ❌ `getDocs()`, `query()`, `where()`
- ❌ `onSnapshot()` directly
- ❌ `runTransaction()` directly
- ❌ `writeBatch()` directly

**Everything is handled by the ORM!**

## 🔗 Next

- [Type Utilities](./06-type-utilities.md) - Type helpers
- [Best Practices](./08-best-practices.md) - Tips and patterns
