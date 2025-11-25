# Field Value Utilities

## 🎯 Overview

Firestore provides special field value functions that allow you to perform atomic operations on fields without reading the document first. NDFirestORM exports these utilities for convenient use.

## 📦 Available Utilities

- `increment(n)` - Increment/decrement numeric fields
- `arrayUnion(...elements)` - Add elements to arrays (no duplicates)
- `arrayRemove(...elements)` - Remove elements from arrays
- `deleteField()` - Delete a field from a document
- `serverTimestamp()` - Set field to server timestamp

## 🔢 increment()

Atomically increment or decrement a numeric field.

### Basic Usage

```typescript
import { increment } from 'ndfirestorm';

// Increment credits by 50
await User.update('user123', {
  credits: increment(50),
});

// Increment login count by 1
await User.update('user123', {
  loginCount: increment(1),
});

// Decrement (negative increment)
await User.update('user123', {
  credits: increment(-20), // Subtract 20
});
```

### Multiple Increments

```typescript
// Update multiple numeric fields at once
await User.update('user123', {
  credits: increment(100),
  loginCount: increment(1),
  points: increment(50),
});
```

### Use Cases

- **Credits/Points System**: Add or subtract credits atomically
- **Counters**: Increment view counts, like counts, etc.
- **Inventory**: Decrease stock when items are sold
- **Statistics**: Track login counts, activity counts, etc.

### Example: E-commerce Stock Management

```typescript
// Product sold - decrease stock
await Product.update('product123', {
  stock: increment(-1),
  soldCount: increment(1),
});

// Product restocked
await Product.update('product123', {
  stock: increment(50),
});
```

## 📋 arrayUnion()

Add elements to an array field. Elements are only added if they don't already exist (no duplicates).

### Basic Usage

```typescript
import { arrayUnion } from 'ndfirestorm';

// Add single tag
await User.update('user123', {
  tags: arrayUnion('premium'),
});

// Add multiple tags
await User.update('user123', {
  tags: arrayUnion('verified', 'active', 'vip'),
});

// Add to multiple arrays
await User.update('user123', {
  tags: arrayUnion('premium'),
  favoriteGyms: arrayUnion('gym1', 'gym2'),
});
```

### Duplicate Handling

```typescript
// If 'premium' already exists, it won't be added again
await User.update('user123', {
  tags: arrayUnion('premium'), // No duplicate created
});
```

### Use Cases

- **Tags/Labels**: Add tags to users, products, etc.
- **Favorites**: Add items to favorites list
- **Permissions**: Add roles or permissions
- **Relationships**: Add followers, friends, etc.

### Example: User Favorites

```typescript
// Add gym to favorites
await User.update('user123', {
  favoriteGyms: arrayUnion('gym456'),
});

// Add multiple products to wishlist
await User.update('user123', {
  wishlist: arrayUnion('prod1', 'prod2', 'prod3'),
});
```

## 🗑️ arrayRemove()

Remove elements from an array field.

### Basic Usage

```typescript
import { arrayRemove } from 'ndfirestorm';

// Remove single tag
await User.update('user123', {
  tags: arrayRemove('trial'),
});

// Remove multiple tags
await User.update('user123', {
  tags: arrayRemove('pending', 'inactive'),
});

// Remove from multiple arrays
await User.update('user123', {
  tags: arrayRemove('trial'),
  blockedUsers: arrayRemove('user456'),
});
```

### Use Cases

- **Remove Tags**: Remove expired or invalid tags
- **Unfavorite**: Remove items from favorites
- **Revoke Permissions**: Remove roles or permissions
- **Unblock**: Remove users from blocked list

### Example: Remove from Favorites

```typescript
// Remove gym from favorites
await User.update('user123', {
  favoriteGyms: arrayRemove('gym456'),
});

// Remove multiple items from wishlist
await User.update('user123', {
  wishlist: arrayRemove('prod1', 'prod2'),
});
```

## ❌ deleteField()

Delete a field from a document.

### Basic Usage

```typescript
import { deleteField } from 'ndfirestorm';

// Delete a field
await User.update('user123', {
  temporaryToken: deleteField(),
});

// Delete multiple fields
await User.update('user123', {
  temporaryToken: deleteField(),
  oldField: deleteField(),
  deprecatedField: deleteField(),
});
```

### Use Cases

- **Remove Temporary Data**: Delete temporary tokens, cache, etc.
- **Clean Up**: Remove deprecated or unused fields
- **Privacy**: Delete sensitive data
- **Schema Migration**: Remove old fields during migration

### Example: Clean Up User Data

```typescript
// Remove temporary session data
await User.update('user123', {
  sessionToken: deleteField(),
  tempData: deleteField(),
});
```

## ⏰ serverTimestamp()

Set a field to the current server timestamp.

### Basic Usage

```typescript
import { serverTimestamp } from 'ndfirestorm';

// Update last login time
await User.update('user123', {
  lastLoginAt: serverTimestamp(),
});

// Add verification timestamp
await User.update('user123', {
  verifiedAt: serverTimestamp(),
});
```

### Use Cases

- **Activity Tracking**: Track last login, last seen, etc.
- **Verification**: Record when something was verified
- **Audit Trail**: Track when changes were made
- **Synchronization**: Ensure consistent timestamps across clients

### Example: Track User Activity

```typescript
// User logs in
await User.update('user123', {
  lastLoginAt: serverTimestamp(),
  loginCount: increment(1),
});

// User verifies email
await User.update('user123', {
  emailVerified: true,
  verifiedAt: serverTimestamp(),
});
```

## 🔄 Combined Operations

You can combine multiple field value operations in a single update:

```typescript
import {
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'ndfirestorm';

// Complex update with multiple operations
await User.update('user123', {
  credits: increment(100),
  loginCount: increment(1),
  tags: arrayUnion('premium', 'verified'),
  oldTags: arrayRemove('trial'),
  lastLoginAt: serverTimestamp(),
  temporaryToken: deleteField(),
});
```

## 💡 Best Practices

### 1. Use Atomic Operations for Counters

```typescript
// ❌ Bad - Race condition possible
const user = await User.find('user123');
await User.update('user123', {
  credits: user.credits + 10, // Another update could happen between read and write
});

// ✅ Good - Atomic operation
await User.update('user123', {
  credits: increment(10), // Atomic, no race condition
});
```

### 2. Combine Operations for Efficiency

```typescript
// ❌ Bad - Multiple updates
await User.update('user123', { credits: increment(10) });
await User.update('user123', { loginCount: increment(1) });
await User.update('user123', { lastLoginAt: serverTimestamp() });

// ✅ Good - Single update
await User.update('user123', {
  credits: increment(10),
  loginCount: increment(1),
  lastLoginAt: serverTimestamp(),
});
```

### 3. Use arrayUnion for Unique Lists

```typescript
// ✅ Good - No duplicates
await User.update('user123', {
  tags: arrayUnion('premium'), // Won't create duplicate
});
```

### 4. Use serverTimestamp for Consistency

```typescript
// ❌ Bad - Client timestamp (can be wrong)
await User.update('user123', {
  lastLoginAt: new Date(), // Client time might be incorrect
});

// ✅ Good - Server timestamp (always accurate)
await User.update('user123', {
  lastLoginAt: serverTimestamp(), // Server time is authoritative
});
```

## 🎯 Real-World Examples

### User Login System

```typescript
async function handleUserLogin(userId: string) {
  await User.update(userId, {
    loginCount: increment(1),
    lastLoginAt: serverTimestamp(),
    status: 'online',
  });
}
```

### E-commerce Product Purchase

```typescript
async function purchaseProduct(productId: string, quantity: number) {
  await Product.update(productId, {
    stock: increment(-quantity),
    soldCount: increment(quantity),
    lastPurchasedAt: serverTimestamp(),
  });
}
```

### Social Media Like System

```typescript
async function likePost(postId: string, userId: string) {
  await Post.update(postId, {
    likes: increment(1),
    likedBy: arrayUnion(userId),
    lastLikedAt: serverTimestamp(),
  });
}

async function unlikePost(postId: string, userId: string) {
  await Post.update(postId, {
    likes: increment(-1),
    likedBy: arrayRemove(userId),
  });
}
```

### Gym Membership Management

```typescript
async function addMemberToGym(gymId: string, userId: string) {
  await Gym.update(gymId, {
    memberCount: increment(1),
    memberIds: arrayUnion(userId),
    lastMemberAddedAt: serverTimestamp(),
  });
}

async function removeMemberFromGym(gymId: string, userId: string) {
  await Gym.update(gymId, {
    memberCount: increment(-1),
    memberIds: arrayRemove(userId),
  });
}
```

## 🔗 Next

- [Best Practices](./08-best-practices.md) - Tips and patterns
- [Type Utilities](./06-type-utilities.md) - Type helpers
