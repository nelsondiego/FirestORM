# Getting Started with NDFirestORM

## 📦 Installation

```bash
npm install ndfirestorm firebase
```

## 🚀 Initial Setup

### 1. Initialize Firebase

```typescript
// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firestore instance
export const firestore = getFirestore(app);
```

### 2. Initialize NDFirestORM

```typescript
// src/orm.ts
import { initializeOrm } from 'ndfirestorm';
import { firestore } from './firebase';

// Initialize the ORM
initializeOrm(firestore, {
  timestamps: true, // Automatically add createdAt and updatedAt
  softDeletes: false, // Soft deletes disabled by default
});
```

### 3. Import in Your Application

```typescript
// src/index.ts or src/main.ts
import './orm'; // Initialize ORM at startup
import { User } from './models/User';

// Now you can use your models
async function main() {
  const users = await User.all();
  console.log(users);
}

main();
```

## 🎯 Your First Model

### Define the Interface

```typescript
// src/models/User.ts
import { Model } from 'ndfirestorm';

// 1. Define the data structure
export interface UserData {
  id: string;
  name: string;
  email: string;
  age: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create the model
export class User extends Model<UserData> {
  static collectionName = 'users';
}
```

### Use the Model

```typescript
// Create user
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 25,
  status: 'active',
});

console.log(user.id); // Auto-generated ID

// Find user
const foundUser = await User.find(user.id);
console.log(foundUser); // { id: "...", name: "John Doe", ... }

// List all users
const allUsers = await User.all();
console.log(allUsers); // Array of users

// Find with conditions
const activeUsers = await User.where('status', '==', 'active').get();
console.log(activeUsers);
```

## 📚 Key Concepts

### JSON First

Query methods return **plain JSON objects**:

```typescript
// ✅ Query methods return JSON (faster, API-ready)
const users = await User.all(); // UserData[]
const user = await User.find('id'); // UserData | null
const activeUsers = await User.where('status', '==', 'active').get();

// ✅ create() returns model instance
const user = await User.create({ name: 'John', email: 'john@example.com' });
await user.update({ name: 'Jane' }); // Can use immediately

// ✅ load() gets model instance for updates/deletes
const user = await User.load('id');
await user?.update({ name: 'Jane' });
await user?.delete();
```

### ID Auto-included

The document ID is **always included** in the object:

```typescript
const user = await User.find('abc123');
console.log(user);
// {
//   id: "abc123",
//   name: "John",
//   email: "john@example.com",
//   ...
// }
```

### Type Safety

Everything is fully typed with TypeScript:

```typescript
const users: UserData[] = await User.all();

users.forEach((user) => {
  console.log(user.name); // ✅ TypeScript knows it's a string
  console.log(user.age); // ✅ TypeScript knows it's a number
  // console.log(user.invalid); // ❌ TypeScript error
});
```

## 🔄 Typical Workflow

```typescript
// 1. Define model
interface ProductData {
  id: string;
  name: string;
  price: number;
  stock: number;
}

class Product extends Model<ProductData> {
  static collectionName = 'products';
}

// 2. Create records
const product = await Product.create({
  name: 'Laptop',
  price: 999.99,
  stock: 10,
});

// 3. Read records
const products = await Product.all();
const laptop = await Product.find(product.id);

// 4. Update records
const productModel = await Product.load(product.id);
await productModel?.update({ stock: 8 });

// 5. Delete records
await productModel?.delete();
```

## 📖 Next Steps

- [Defining Models](./02-defining-models.md) - Learn to create complex models
- [Queries](./03-queries.md) - Advanced queries
- [CRUD Operations](./04-crud-operations.md) - Create, read, update, delete
- [Pagination](./05-pagination.md) - Paginate results

## 💡 Tips

1. **Always define interfaces** for your data
2. **Use descriptive names** for your collections
3. **Export both interface and model** to use them in other files
4. **Initialize the ORM once** at application startup

## 🚨 Common Errors

### Error: "Firestore not initialized"

```typescript
// ❌ Wrong - ORM not initialized
const users = await User.all();

// ✅ Correct - Initialize first
import { initializeOrm } from 'ndfirestorm';
import { firestore } from './firebase';

initializeOrm(firestore);
const users = await User.all();
```

### Error: "Cannot read property 'update' of null"

```typescript
// ❌ Wrong - Not checking if user exists
const user = await User.load('id');
await user.update({ name: 'New Name' }); // Error if user is null

// ✅ Correct - Check first
const user = await User.load('id');
if (user) {
  await user.update({ name: 'New Name' });
}

// ✅ Or use optional chaining
const user = await User.load('id');
await user?.update({ name: 'New Name' });
```

### Error: "collectionName is not defined"

```typescript
// ❌ Wrong - Missing collectionName
class User extends Model<UserData> {}

// ✅ Correct - Define collectionName
class User extends Model<UserData> {
  static collectionName = 'users';
}
```

## 🎉 Ready!

You now have the basics to start using NDFirestORM. Continue with the next guide to learn more about defining complex models.
