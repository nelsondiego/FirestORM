# Subcollections

## 🎯 Overview

Subcollections allow you to nest collections within documents, creating hierarchical data structures in Firestore.

**Example Structure:**

```
gyms/{gymId}/equipments/{equipmentId}
gyms/{gymId}/members/{memberId}
users/{userId}/notifications/{notificationId}
```

## 📚 Accessing Subcollections

### From Model Instance

```typescript
// Load parent document
const gym = await Gym.load('gym123');

if (gym) {
  // Access subcollection
  const equipments = await gym.subcollection('equipments').get();
  console.log('Equipment:', equipments);
}
```

### Static Method

```typescript
// Access subcollection without loading parent
const equipments = await Gym.subcollection('gym123', 'equipments').get();
console.log('Equipment:', equipments);
```

## 🔍 Querying Subcollections

All QueryBuilder methods work with subcollections:

### Basic Queries

```typescript
const gym = await Gym.load('gym123');

// Get all equipment
const allEquipment = await gym.subcollection('equipments').get();

// Filter by status
const activeEquipment = await gym
  .subcollection('equipments')
  .where('status', '==', 'active')
  .get();

// Order and limit
const latestEquipment = await gym
  .subcollection('equipments')
  .orderBy('purchaseDate', 'desc')
  .limit(10)
  .get();
```

### Complex Queries

```typescript
// Multiple conditions
const brokenTreadmills = await gym
  .subcollection('equipments')
  .where('type', '==', 'treadmill')
  .where('status', '==', 'broken')
  .get();

// With pagination
const result = await gym
  .subcollection('equipments')
  .orderBy('name', 'asc')
  .paginate({ perPage: 20, page: 1 });
```

## 🔴 Real-time Subscriptions

Listen to subcollection changes in real-time:

```typescript
const gym = await Gym.load('gym123');

// Listen to all equipment
const unsubscribe = gym.subcollection('equipments').listen((equipments) => {
  console.log('Equipment updated:', equipments);
});

// Listen to active equipment only
const unsubscribe = gym
  .subcollection('equipments')
  .where('status', '==', 'active')
  .listen((activeEquipment) => {
    console.log('Active equipment:', activeEquipment);
  });

// Stop listening
unsubscribe();
```

### React Example

```typescript
function GymEquipment({ gymId }: { gymId: string }) {
  const [equipments, setEquipments] = useState<EquipmentData[]>([]);

  useEffect(() => {
    const unsubscribe = Gym.subcollection(gymId, 'equipments')
      .where('status', '==', 'active')
      .orderBy('name', 'asc')
      .listen((data) => {
        setEquipments(data);
      });

    return () => unsubscribe();
  }, [gymId]);

  return (
    <ul>
      {equipments.map((eq) => (
        <li key={eq.id}>{eq.name}</li>
      ))}
    </ul>
  );
}
```

## ✏️ CRUD Operations on Subcollections

### Create Documents

```typescript
// Create with auto-generated ID
const equipment = await gym.subcollection('equipments').create({
  name: 'Treadmill Pro 3000',
  quantity: 5,
  status: 'active',
});

console.log(equipment.id); // Auto-generated ID

// Create with custom ID
const feature = await gym.subcollection('features').create(
  {
    icon: 'wifi',
    title: 'WiFi Gratis',
  },
  'wifi' // Custom ID
);

// Static method (without loading gym)
const equipment2 = await Gym.subcollection('gym123', 'equipments').create({
  name: 'Dumbbell Set',
  quantity: 20,
  status: 'active',
});
```

### Update Documents

```typescript
// Update by ID
await gym.subcollection('equipments').update('equipment123', {
  quantity: 10,
  status: 'maintenance',
});

// Static method (without loading gym)
await Gym.subcollection('gym123', 'equipments').update('equipment123', {
  quantity: 15,
});
```

### Find Document by ID

```typescript
// Find specific document
const equipment = await gym.subcollection('equipments').find('equipment123');

if (equipment) {
  console.log(equipment.name);
  console.log(equipment.quantity);
}

// Static method (without loading gym)
const equipment2 = await Gym.subcollection('gym123', 'equipments').find(
  'equipment123'
);
```

### Delete Single Document

```typescript
// Delete by ID
await gym.subcollection('equipments').destroy('equipment123');

// Static method (without loading gym)
await Gym.subcollection('gym123', 'equipments').destroy('equipment123');
```

## 🗑️ Deleting Subcollections

### Delete All Documents (Batch)

```typescript
// Delete all equipment in a gym (uses batch internally)
const gym = await Gym.load('gym123');
const deletedCount = await gym.subcollection('equipments').deleteAll();
console.log(`Deleted ${deletedCount} equipment items`);

// Delete with filter
const deletedCount = await gym
  .subcollection('equipments')
  .where('status', '==', 'broken')
  .deleteAll();
console.log(`Deleted ${deletedCount} broken equipment`);
```

### Atomic Delete in Transaction (NEW!)

Delete subcollections atomically within a transaction:

```typescript
// Delete subcollections atomically
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

### Cascade Delete with Related Data

```typescript
// Delete gym with subcollections and related collections
await Gym.transaction(async (ctx) => {
  const gym = await Gym.load('gym123');
  if (!gym) throw new Error('Gym not found');

  // Delete gym with subcollections and custom logic
  await ctx.deleteCascade(gym, {
    subcollections: ['equipments', 'members', 'features'],
    onBeforeDelete: async () => {
      // Delete related collections
      const staff = await GymStaff.where('gymId', '==', gym.id).get();
      for (const s of staff) {
        const staffModel = await GymStaff.load(s.id);
        if (staffModel) await ctx.delete(staffModel);
      }

      // Update user references
      const users = await User.where('myGyms', 'array-contains', gym.id).get();
      for (const u of users) {
        const user = await User.load(u.id);
        if (user) {
          const currentGyms = user.get('myGyms') || [];
          await ctx.update(user, {
            myGyms: currentGyms.filter((id) => id !== gym.id),
          });
        }
      }
    },
  });
});

console.log('Complete atomic deletion successful!');
```

## 🎯 Complete Example: Delete Gym with Related Data

### Atomic Approach (Recommended)

Everything happens atomically - either all succeeds or nothing changes:

```typescript
async function deleteGymAtomically(gymId: string) {
  await Gym.transaction(async (ctx) => {
    const gym = await Gym.load(gymId);
    if (!gym) throw new Error('Gym not found');

    // Delete gym with all subcollections and related data atomically
    await ctx.deleteCascade(gym, {
      subcollections: ['equipments', 'members', 'features'],
      onBeforeDelete: async () => {
        // Delete all gym staff
        const staffMembers = await GymStaff.where('gymId', '==', gymId).get();
        for (const staffData of staffMembers) {
          const staff = await GymStaff.load(staffData.id);
          if (staff) await ctx.delete(staff);
        }

        // Update users - remove gym from myGyms array
        const users = await User.where('myGyms', 'array-contains', gymId).get();
        for (const userData of users) {
          const user = await User.load(userData.id);
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

  console.log('✅ Gym and all related data deleted atomically!');
}

// Usage
await deleteGymAtomically('gym123');
```

### Non-Atomic Approach (For Large Datasets)

Use when you have more than 500 total documents to delete:

```typescript
async function deleteGymCompletely(gymId: string) {
  // Step 1: Delete subcollections (use deleteAll for efficiency)
  console.log('Deleting subcollections...');
  const equipmentCount = await Gym.subcollection(
    gymId,
    'equipments'
  ).deleteAll();
  const memberCount = await Gym.subcollection(gymId, 'members').deleteAll();
  console.log(`Deleted ${equipmentCount} equipment, ${memberCount} members`);

  // Step 2: Delete related documents and update references (transaction)
  await Gym.transaction(async (ctx) => {
    // Load gym
    const gym = await Gym.load(gymId);
    if (!gym) throw new Error('Gym not found');

    // Delete all gym staff
    const staffMembers = await GymStaff.where('gymId', '==', gymId).get();
    for (const staffData of staffMembers) {
      const staff = await GymStaff.load(staffData.id);
      if (staff) {
        await ctx.delete(staff);
      }
    }

    // Update users - remove gym from myGyms array
    const users = await User.where('myGyms', 'array-contains', gymId).get();
    for (const userData of users) {
      const user = await User.load(userData.id);
      if (user) {
        const currentGyms = user.get('myGyms') || [];
        const updatedGyms = currentGyms.filter((id) => id !== gymId);
        await ctx.update(user, { myGyms: updatedGyms });
      }
    }

    // Delete gym
    await ctx.delete(gym);
  });

  console.log('Gym and all related data deleted successfully');
}

// Usage
await deleteGymCompletely('gym123');
```

## 📦 Batch Operations with Subcollections

```typescript
// Create multiple equipment items
await Gym.batch(async (ctx) => {
  const equipments = [
    { name: 'Treadmill 1', type: 'cardio', status: 'active' },
    { name: 'Treadmill 2', type: 'cardio', status: 'active' },
    { name: 'Bike 1', type: 'cardio', status: 'active' },
  ];

  // Note: Batch operations with subcollections require direct Firestore access
  // This is a limitation of the current implementation
  // Use create() in a loop or implement custom batch logic
});
```

## 💡 Best Practices

### 1. Use deleteAll() for Bulk Deletes

```typescript
// ✅ Good - Efficient batch delete
await gym.subcollection('equipments').deleteAll();

// ❌ Bad - Slow individual deletes
const equipments = await gym.subcollection('equipments').get();
for (const eq of equipments) {
  await Gym.destroy(eq.id); // Won't work for subcollections anyway
}
```

### 2. Delete Subcollections Before Parent

```typescript
// ✅ Good - Delete children first
await gym.subcollection('equipments').deleteAll();
await gym.subcollection('members').deleteAll();
await gym.delete();

// ❌ Bad - Orphaned subcollections
await gym.delete(); // Subcollections remain!
```

### 3. Use Transactions for Related Data

```typescript
// ✅ Good - Atomic updates across collections
await Gym.transaction(async (ctx) => {
  const gym = await Gym.load('gym123');
  const staff = await GymStaff.where('gymId', '==', 'gym123').get();

  // Update all atomically
  for (const staffData of staff) {
    const s = await GymStaff.load(staffData.id);
    if (s) await ctx.delete(s);
  }

  if (gym) await ctx.delete(gym);
});
```

### 4. Handle Large Subcollections

```typescript
// ✅ Good - deleteAll() handles batching automatically
const deletedCount = await gym.subcollection('equipments').deleteAll();

// ✅ Good - Process in chunks if needed
const equipments = await gym.subcollection('equipments').get();
const CHUNK_SIZE = 100;

for (let i = 0; i < equipments.length; i += CHUNK_SIZE) {
  const chunk = equipments.slice(i, i + CHUNK_SIZE);
  // Process chunk
}
```

## ⚠️ Limitations

### Transaction Size Limit

Firestore transactions have a **500 document limit**. If you need to delete more:

```typescript
// ✅ Good - Under 500 documents total
await Gym.transaction(async (ctx) => {
  const gym = await Gym.load('gym123');
  if (gym) {
    await ctx.deleteCascade(gym, {
      subcollections: ['equipments', 'members'], // < 500 docs total
    });
  }
});

// ❌ Bad - Over 500 documents
await Gym.transaction(async (ctx) => {
  const gym = await Gym.load('gym123');
  if (gym) {
    await ctx.deleteCascade(gym, {
      subcollections: ['equipments'], // 1000+ documents - will fail!
    });
  }
});

// ✅ Solution - Use deleteAll() for large subcollections
const equipmentCount = await Gym.subcollection(
  'gym123',
  'equipments'
).deleteAll();
console.log(`Deleted ${equipmentCount} equipment items`);

// Then delete parent in transaction
await Gym.transaction(async (ctx) => {
  const gym = await Gym.load('gym123');
  if (gym) await ctx.delete(gym);
});
```

### Choosing the Right Approach

| Scenario                               | Approach                              |
| -------------------------------------- | ------------------------------------- |
| < 500 total documents                  | ✅ Use `ctx.deleteCascade()` (atomic) |
| > 500 documents in subcollections      | ⚠️ Use `deleteAll()` then transaction |
| Need absolute atomicity                | ✅ Use `ctx.deleteCascade()` (atomic) |
| Large dataset, atomicity less critical | ⚠️ Use `deleteAll()` (batch)          |
| Mix of small and large subcollections  | ⚠️ Atomic for small, batch for large  |

## 🔗 Next

- [Best Practices](./08-best-practices.md) - Tips and patterns
- [Type Utilities](./06-type-utilities.md) - Type helpers
