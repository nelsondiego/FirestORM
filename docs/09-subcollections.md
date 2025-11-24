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

## 🗑️ Deleting Subcollections

### Delete All Documents

```typescript
// Delete all equipment in a gym
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

### Delete in Transaction

```typescript
await Gym.transaction(async (ctx) => {
  const gym = await Gym.load('gym123');
  if (!gym) throw new Error('Gym not found');

  // Get subcollection documents
  const equipments = await gym.subcollection('equipments').get();

  // Note: deleteAll() uses batches internally, so for transactions
  // you need to handle subcollection deletes separately or use batch

  // Delete gym
  await ctx.delete(gym);
});

// Then delete subcollections with batch
await Gym.subcollection('gym123', 'equipments').deleteAll();
```

## 🎯 Complete Example: Delete Gym with Related Data

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

### Subcollections in Transactions

Firestore transactions have limitations with subcollections. For complex deletions:

1. **Use deleteAll() outside transaction** for subcollections
2. **Use transaction** for parent and related collections
3. **Combine both** for complete atomic-like behavior

```typescript
// Recommended pattern
async function deleteGym(gymId: string) {
  // 1. Delete subcollections (batch)
  await Gym.subcollection(gymId, 'equipments').deleteAll();
  await Gym.subcollection(gymId, 'members').deleteAll();

  // 2. Delete related data (transaction)
  await Gym.transaction(async (ctx) => {
    const gym = await Gym.load(gymId);
    const staff = await GymStaff.where('gymId', '==', gymId).get();

    for (const s of staff) {
      const staffModel = await GymStaff.load(s.id);
      if (staffModel) await ctx.delete(staffModel);
    }

    if (gym) await ctx.delete(gym);
  });
}
```

## 🔗 Next

- [Best Practices](./08-best-practices.md) - Tips and patterns
- [Type Utilities](./06-type-utilities.md) - Type helpers
