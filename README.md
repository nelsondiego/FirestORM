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

// Update
const user = await User.load('id'); // Returns model instance
await user?.update({ name: 'Jane' });

// Delete
await user.delete();
// or
await User.destroy('id');
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
