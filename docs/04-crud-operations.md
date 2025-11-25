# CRUD Operations

## 📝 Create

### Basic Create

```typescript
// Create a new user
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 25,
  status: 'active',
});

console.log(user.id); // Auto-generated ID
console.log(user.toJSON()); // Full user object
```

### Create with Timestamps

Timestamps are added automatically if enabled in configuration:

```typescript
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
});

// Automatically includes:
// - id: "auto-generated"
// - createdAt: Date
// - updatedAt: Date
```

### Create Multiple Records

```typescript
// Create multiple users
const users = await Promise.all([
  User.create({ name: 'John', email: 'john@example.com' }),
  User.create({ name: 'Jane', email: 'jane@example.com' }),
  User.create({ name: 'Bob', email: 'bob@example.com' }),
]);

console.log(users.length); // 3
```

## 📖 Read

### Find by ID

```typescript
// Find and return JSON
const user: UserData | null = await User.find('user123');

if (user) {
  console.log(user.name);
  console.log(user.email);
}

// Load model instance for updates
const userModel = await User.load('user123');
if (userModel) {
  await userModel.update({ name: 'New Name' });
}

// Find or throw error
try {
  const user = await User.findOrFail('user123');
  console.log(user);
} catch (error) {
  console.error('User not found');
}
```

### Get All

```typescript
// Get all as JSON
const users: UserData[] = await User.all();

// Get all as JSON (default)
const users = await User.all();
```

### Get with Conditions

```typescript
// Get active users
const activeUsers = await User.where('status', '==', 'active').get();

// Get first match
const admin = await User.where('role', '==', 'admin').first();

// Get first or throw
const admin = await User.where('role', '==', 'admin').firstOrFail();
```

## ✏️ Update

NDFirestORM provides two ways to update documents:

1. **`Model.update(id, data)`** - Update by ID (fastest, no loading needed)
2. **`model.update(data)`** - Update model instance (for complex logic or hooks)

### Update by ID (Recommended for Simple Updates)

```typescript
// Update directly by ID without loading the model first
await User.update('user123', {
  name: 'Jane Doe',
  age: 26,
});

// This is the fastest way to update a document
// Automatically adds updatedAt timestamp
```

### Update with Model Instance

```typescript
// Load model instance first
const user = await User.load('user123');

if (user) {
  // Method 1: Using update()
  await user.update({
    name: 'Jane Doe',
    age: 26,
  });

  // Method 2: Using set() and save()
  user.set('name', 'Jane Doe');
  user.set('age', 26);
  await user.save();

  // Method 3: Using fill() and save()
  user.fill({
    name: 'Jane Doe',
    age: 26,
  });
  await user.save();
}

// Use instance methods when:
// - You need to check isDirty()
// - You have custom update hooks
// - You need complex validation logic
// - You already have the model loaded
```

### Update Single Field

```typescript
// Option 1: Update by ID (faster)
await User.update('user123', { status: 'inactive' });

// Option 2: Load and update (if you need the instance)
const user = await User.load('user123');
if (user) {
  await user.update({ status: 'inactive' });
}
```

### Update Multiple Fields

```typescript
// Option 1: Update by ID (faster)
await User.update('user123', {
  name: 'New Name',
  email: 'newemail@example.com',
  age: 30,
  status: 'active',
});

// Option 2: Load and update (if you need the instance)
const user = await User.load('user123');
if (user) {
  await user.update({
    name: 'New Name',
    email: 'newemail@example.com',
    age: 30,
    status: 'active',
  });
}
```

### Update Methods Comparison

| Method                   | Use Case                              | Speed      | Returns Instance | Hooks |
| ------------------------ | ------------------------------------- | ---------- | ---------------- | ----- |
| `Model.update(id, data)` | Simple update, no hooks needed        | ⚡ Fastest | ❌               | ❌    |
| `model.update(data)`     | Update with hooks or validation       | 🐢 Slower  | ✅               | ✅    |
| `model.set() + save()`   | Multiple changes with isDirty() check | 🐢 Slower  | ✅               | ✅    |
| `model.fill() + save()`  | Bulk changes with isDirty() check     | 🐢 Slower  | ✅               | ✅    |

**Recommendation:**

- Simple update → Use `Model.update(id, data)`
- Update with validation → Use `model.update(data)`
- Multiple changes with checks → Use `model.set()` + `save()`

### Check if Modified

```typescript
const user = await User.load('user123');

user.set('name', 'New Name');
console.log(user.isDirty()); // true

await user.save();
console.log(user.isDirty()); // false
```

### Refresh from Database

```typescript
const user = await User.load('user123');

// Make changes locally
user.set('name', 'Local Change');

// Refresh from database (discards local changes)
await user.refresh();

console.log(user.get('name')); // Original name from database
```

## 🗑️ Delete

NDFirestORM provides three ways to delete documents:

1. **`destroy(id)`** - Delete by ID (fastest, no loading needed)
2. **`delete()`** - Delete model instance (for soft deletes or hooks)
3. **`deleteAll()`** - Batch delete all matching documents

### Delete by ID (Recommended for Simple Deletes)

```typescript
// Delete directly by ID without loading the model first
await User.destroy('user123');

// This is the fastest way to delete a single document
// Use when you don't need soft deletes or custom hooks
```

### Delete Model Instance

```typescript
// Load model instance first
const user = await User.load('user123');

if (user) {
  // Delete the user
  await user.delete();
}

// Or use optional chaining
const user = await User.load('user123');
await user?.delete();

// Use this method when:
// - You need soft deletes
// - You have custom delete hooks
// - You already have the model loaded
```

### Batch Delete (Recommended for Multiple Documents)

```typescript
// Delete all matching documents in one operation
await User.where('status', '==', 'inactive').deleteAll();

// This is the most efficient way to delete multiple documents
// Automatically handles batching (500 docs per batch)
console.log(`Deleted ${count} users`);
```

### Delete Multiple (Manual Loop)

```typescript
// Option 1: Delete by ID (faster, no need to load)
const inactiveUsers = await User.where('status', '==', 'inactive').get();
for (const userData of inactiveUsers) {
  await User.destroy(userData.id);
}

// Option 2: Load and delete (if you need to run hooks or soft delete)
const inactiveUsers = await User.where('status', '==', 'inactive').get();
for (const userData of inactiveUsers) {
  const user = await User.load(userData.id);
  await user?.delete();
}

// Option 3: Batch delete (recommended - see above)
await User.where('status', '==', 'inactive').deleteAll();
```

### Delete Methods Comparison

| Method                  | Use Case                               | Speed      | Soft Delete | Hooks |
| ----------------------- | -------------------------------------- | ---------- | ----------- | ----- |
| `destroy(id)`           | Single document, no hooks needed       | ⚡ Fastest | ❌          | ❌    |
| `model.delete()`        | Single document with hooks/soft delete | 🐢 Slower  | ✅          | ✅    |
| `query.deleteAll()`     | Multiple documents, batch operation    | ⚡ Fast    | ❌          | ❌    |
| Manual loop + destroy() | Multiple documents with control        | 🐢 Slowest | ❌          | ❌    |
| Manual loop + delete()  | Multiple documents with hooks          | 🐢 Slowest | ✅          | ✅    |

**Recommendation:**

- Single delete without hooks → Use `destroy(id)`
- Single delete with hooks → Use `model.delete()`
- Multiple deletes → Use `query.deleteAll()`
- Multiple deletes with hooks → Use manual loop with `model.delete()`

````

### Soft Delete (if enabled)

```typescript
// Configure model with soft deletes
export class User extends Model<UserData> {
  static collectionName = 'users';
  protected softDeletes = true; // Enable soft deletes
}

// Soft delete (sets deletedAt field)
const user = await User.load('user123');
await user.delete(); // Sets deletedAt instead of deleting

// Force delete (permanent)
await user.forceDelete(); // Actually deletes the document
````

## 🔄 Complete CRUD Examples

### User Management

```typescript
// CREATE
async function createUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password, // Should be hashed!
    status: 'active',
    emailVerified: false,
  });

  return user.toJSON();
}

// READ
async function getUser(id: string) {
  const user = await User.find(id);

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

async function getUsersByStatus(status: string) {
  return User.where('status', '==', status).get();
}

// UPDATE
async function updateUser(id: string, data: Partial<UserData>) {
  // Option 1: Update by ID (simpler and faster)
  await User.update(id, data);

  // Return updated data
  return User.findOrFail(id);
}

// Or if you need the instance for validation:
async function updateUserWithValidation(id: string, data: Partial<UserData>) {
  const user = await User.load(id);

  if (!user) {
    throw new Error('User not found');
  }

  // Custom validation
  if (data.email && !isValidEmail(data.email)) {
    throw new Error('Invalid email');
  }

  await user.update(data);
  return user.toJSON();
}

async function verifyUserEmail(id: string) {
  // Simple update by ID
  await User.update(id, { emailVerified: true });
  return User.findOrFail(id);
}

// DELETE
async function deleteUser(id: string) {
  // Option 1: Delete by ID (simpler)
  await User.destroy(id);
  return { success: true };
}

// Or if you need to check if it exists first:
async function deleteUserSafe(id: string) {
  const user = await User.load(id);

  if (!user) {
    throw new Error('User not found');
  }

  await user.delete();
  return { success: true };
}

async function deactivateUser(id: string) {
  // Simple update by ID
  await User.update(id, { status: 'inactive' });
  return User.findOrFail(id);
}
```

### Product Management

```typescript
// CREATE
async function createProduct(data: {
  name: string;
  price: number;
  stock: number;
}) {
  const product = await Product.create({
    sku: generateSKU(),
    name: data.name,
    price: data.price,
    stock: data.stock,
    status: 'draft',
    published: false,
  });

  return product.toJSON();
}

// READ
async function getProduct(id: string) {
  return Product.find(id);
}

async function getPublishedProducts() {
  return Product.where('published', '==', true)
    .where('stock', '>', 0)
    .orderBy('createdAt', 'desc')
    .get();
}

// UPDATE
async function updateProductStock(id: string, quantity: number) {
  const product = await Product.load(id);

  if (!product) {
    throw new Error('Product not found');
  }

  const currentStock = product.get('stock') || 0;
  await product.update({ stock: currentStock + quantity });

  return product.toJSON();
}

async function publishProduct(id: string) {
  const product = await Product.load(id);

  if (!product) {
    throw new Error('Product not found');
  }

  await product.update({
    published: true,
    publishedAt: new Date(),
    status: 'active',
  });

  return product.toJSON();
}

// DELETE
async function deleteProduct(id: string) {
  // Delete directly by ID
  await Product.destroy(id);
  return { success: true };
}

async function archiveProduct(id: string) {
  const product = await Product.load(id);

  if (!product) {
    throw new Error('Product not found');
  }

  await product.update({
    status: 'archived',
    published: false,
  });

  return product.toJSON();
}
```

## 🎯 Best Practices

### 1. Always Check if Record Exists

```typescript
// ❌ Bad - Might throw error
const user = await User.load('user123');
await user.update({ name: 'New Name' }); // Error if user is null

// ✅ Good - Check first
const user = await User.load('user123');
if (user) {
  await user.update({ name: 'New Name' });
}

// ✅ Good - Use optional chaining
const user = await User.load('user123');
await user?.update({ name: 'New Name' });

// ✅ Good - Use findOrFail for JSON
try {
  const userData = await User.findOrFail('user123');
  console.log(userData);
} catch (error) {
  console.error('User not found');
}
```

### 2. Use Transactions for Related Updates

```typescript
// When updating multiple related documents,
// consider using Firestore transactions
// (Transaction support coming in future version)
```

### 3. Validate Data Before Create/Update

```typescript
async function createUser(data: any) {
  // Validate data
  if (!data.email || !isValidEmail(data.email)) {
    throw new Error('Invalid email');
  }

  if (!data.name || data.name.length < 2) {
    throw new Error('Name must be at least 2 characters');
  }

  // Create user
  return User.create(data);
}
```

### 4. Use Soft Deletes for Important Data

```typescript
// Enable soft deletes for models with important data
export class Order extends Model<OrderData> {
  static collectionName = 'orders';
  protected softDeletes = true; // Don't permanently delete orders
}
```

### 5. Return Consistent Response Format

```typescript
async function updateUser(id: string, data: Partial<UserData>) {
  try {
    const user = await User.load(id);

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    await user.update(data);

    return {
      success: true,
      data: user.toJSON(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

## 💡 Tips

1. **Use static methods for simple operations** - `Model.update(id, data)` and `Model.destroy(id)` are faster
2. **Use model instances for complex logic** - When you need validation, hooks, or `isDirty()` checks
3. **Use JSON for reads** - Faster and lighter with `find()` and `get()`
4. **Use `deleteAll()` for batch deletes** - More efficient than looping
5. **Check isDirty()** - Before saving to avoid unnecessary writes
6. **Use refresh()** - To get latest data from database
7. **Batch operations** - Use Promise.all() for multiple operations

### Quick Reference

| Operation        | Simple (No Hooks)        | Complex (With Hooks/Validation)   |
| ---------------- | ------------------------ | --------------------------------- |
| **Create**       | `Model.create(data)`     | `Model.create(data)` + validation |
| **Read**         | `Model.find(id)`         | `Model.load(id)`                  |
| **Update**       | `Model.update(id, data)` | `model.update(data)`              |
| **Delete**       | `Model.destroy(id)`      | `model.delete()`                  |
| **Batch Delete** | `query.deleteAll()`      | Loop with `model.delete()`        |

## 🔗 Next

- [Pagination](./05-pagination.md) - Paginate results
- [Type Utilities](./06-type-utilities.md) - Use type helpers
