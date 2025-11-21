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

### Update with Model Instance

```typescript
// Load model instance
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
```

### Update Single Field

```typescript
const user = await User.load('user123');

if (user) {
  await user.update({ status: 'inactive' });
}
```

### Update Multiple Fields

```typescript
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

### Delete Model Instance

```typescript
// Load model instance
const user = await User.load('user123');

if (user) {
  // Delete the user
  await user.delete();
}

// Or use optional chaining
const user = await User.load('user123');
await user?.delete();
```

### Delete by ID

```typescript
// Delete directly by ID
await User.destroy('user123');
```

### Delete Multiple

```typescript
// Get users to delete (as JSON)
const inactiveUsers = await User.where('status', '==', 'inactive').get();

// Delete each one by loading instance
for (const userData of inactiveUsers) {
  const user = await User.load(userData.id);
  await user?.delete();
}
```

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
```

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
  const user = await User.load(id);

  if (!user) {
    throw new Error('User not found');
  }

  await user.update(data);
  return user.toJSON();
}

async function verifyUserEmail(id: string) {
  const user = await User.load(id);

  if (!user) {
    throw new Error('User not found');
  }

  await user.update({ emailVerified: true });
  return user.toJSON();
}

// DELETE
async function deleteUser(id: string) {
  const user = await User.load(id);

  if (!user) {
    throw new Error('User not found');
  }

  await user.delete();
  return { success: true };
}

async function deactivateUser(id: string) {
  const user = await User.load(id);

  if (!user) {
    throw new Error('User not found');
  }

  await user.update({ status: 'inactive' });
  return user.toJSON();
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

1. **Use Model instances for updates** - They have helper methods
2. **Use JSON for reads** - Faster and lighter
3. **Check isDirty()** - Before saving to avoid unnecessary writes
4. **Use refresh()** - To get latest data from database
5. **Batch operations** - Use Promise.all() for multiple operations

## 🔗 Next

- [Pagination](./05-pagination.md) - Paginate results
- [Type Utilities](./06-type-utilities.md) - Use type helpers
