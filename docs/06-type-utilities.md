# Type Utilities

NDFirestORM provides several type utilities to make working with TypeScript easier and safer.

## 📦 Available Type Utilities

```typescript
import {
  ModelData,
  InferModelType,
  CreateModelData,
  UpdateModelData,
} from 'ndfirestorm';
```

## 🎯 ModelData<M>

Extracts the data type from a Model.

### Usage

```typescript
import { User } from '@/models/User';
import { ModelData } from 'ndfirestorm';

// Extract the type
type UserType = ModelData<User>;
// Same as: UserData

// Use in functions
function processUser(user: ModelData<User>): void {
  console.log(user.name);
  console.log(user.email);
}

// Use in variables
const user: ModelData<User> = await User.find('user123');
```

### When to Use

- When you don't want to import the interface separately
- When working with generic functions
- When the interface name might change

## 🔍 InferModelType<typeof Model>

Infers the type from a Model class.

### Usage

```typescript
import { User } from '@/models/User';
import { InferModelType } from 'ndfirestorm';

// Infer from class
type UserType = InferModelType<typeof User>;

// Use in generic functions
function formatModel<T extends typeof Model>(
  ModelClass: T,
  data: InferModelType<T>
): string {
  return JSON.stringify(data);
}

// Usage
const formatted = formatModel(User, userData);
```

### When to Use

- When working with Model classes as parameters
- When creating generic utilities
- When you need to infer types dynamically

## ✏️ CreateModelData<M>

Type for creating new records (excludes id, timestamps, deletedAt).

### Usage

```typescript
import { User } from '@/models/User';
import { CreateModelData } from 'ndfirestorm';

// Type for creating
type CreateUserInput = CreateModelData<User>;
// {
//   name: string;
//   email: string;
//   age: number;
//   status: 'active' | 'inactive';
//   // NO id, createdAt, updatedAt, deletedAt
// }

// Use in functions
async function createUser(data: CreateModelData<User>) {
  return User.create(data);
}

// Usage
const user = await createUser({
  name: 'John Doe',
  email: 'john@example.com',
  age: 25,
  status: 'active',
  // id: '123', // ❌ Error - id is not allowed
  // createdAt: new Date(), // ❌ Error - createdAt is not allowed
});
```

### When to Use

- API endpoints that create records
- Form validation schemas
- Service layer functions
- Ensuring users don't provide id or timestamps

## 🔄 UpdateModelData<M>

Type for updating records (partial, excludes id and createdAt).

### Usage

```typescript
import { User } from '@/models/User';
import { UpdateModelData } from 'ndfirestorm';

// Type for updating
type UpdateUserInput = UpdateModelData<User>;
// {
//   name?: string;
//   email?: string;
//   age?: number;
//   status?: 'active' | 'inactive';
//   updatedAt?: Date;
//   // NO id, createdAt
// }

// Use in functions
async function updateUser(
  id: string,
  data: UpdateModelData<User>
): Promise<void> {
  const user = await User.load(id);
  if (user) {
    await user.update(data);
  }
}

// Usage
await updateUser('user123', {
  name: 'Jane Doe',
  age: 26,
  // All fields are optional
  // id: '123', // ❌ Error - id is not allowed
  // createdAt: new Date(), // ❌ Error - createdAt is not allowed
});
```

### When to Use

- API endpoints that update records
- Patch operations
- Service layer functions
- Ensuring users don't modify id or createdAt

## 📝 Complete Examples

### API Endpoints with Type Safety

```typescript
// types/api.ts
import { User, Product } from '@/models';
import { CreateModelData, UpdateModelData } from 'ndfirestorm';

export type CreateUserRequest = CreateModelData<User>;
export type UpdateUserRequest = UpdateModelData<User>;
export type CreateProductRequest = CreateModelData<Product>;
export type UpdateProductRequest = UpdateModelData<Product>;

// routes/users.ts
import { Request, Response } from 'express';
import { CreateUserRequest, UpdateUserRequest } from '@/types/api';

app.post('/users', async (req: Request, res: Response) => {
  const data: CreateUserRequest = req.body;

  // TypeScript ensures data doesn't have id or timestamps
  const user = await User.create(data);

  res.json(user.toJSON());
});

app.patch('/users/:id', async (req: Request, res: Response) => {
  const data: UpdateUserRequest = req.body;

  const user = await User.load(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  await user.update(data);
  res.json(user.toJSON());
});
```

### Service Layer with Type Safety

```typescript
// services/userService.ts
import { User } from '@/models/User';
import { ModelData, CreateModelData, UpdateModelData } from 'ndfirestorm';

export class UserService {
  // Get user
  async getUser(id: string): Promise<ModelData<User> | null> {
    return User.find(id);
  }

  // Get all users
  async getAllUsers(): Promise<ModelData<User>[]> {
    return User.all();
  }

  // Create user
  async createUser(data: CreateModelData<User>): Promise<ModelData<User>> {
    const user = await User.create(data);
    return user.toJSON();
  }

  // Update user
  async updateUser(
    id: string,
    data: UpdateModelData<User>
  ): Promise<ModelData<User>> {
    const user = await User.load(id);

    if (!user) {
      throw new Error('User not found');
    }

    await user.update(data);
    return user.toJSON();
  }

  // Delete user
  async deleteUser(id: string): Promise<void> {
    await User.destroy(id);
  }
}
```

### Form Validation with Zod

```typescript
import { z } from 'zod';
import { User } from '@/models/User';
import { CreateModelData } from 'ndfirestorm';

// Create schema based on CreateModelData type
const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().min(18).max(120),
  status: z.enum(['active', 'inactive']),
}) satisfies z.ZodType<CreateModelData<User>>;

// Validate and create
async function createValidatedUser(input: unknown) {
  const validated = createUserSchema.parse(input);
  return User.create(validated);
}

// Update schema
const updateUserSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    age: z.number().min(18).max(120),
    status: z.enum(['active', 'inactive']),
  })
  .partial() satisfies z.ZodType<UpdateModelData<User>>;
```

### Generic Repository Pattern

```typescript
import {
  Model,
  ModelData,
  CreateModelData,
  UpdateModelData,
} from 'ndfirestorm';

export class Repository<M extends Model> {
  constructor(private ModelClass: new () => M) {}

  async findById(id: string): Promise<ModelData<M> | null> {
    return (this.ModelClass as any).find(id);
  }

  async findAll(): Promise<ModelData<M>[]> {
    return (this.ModelClass as any).all();
  }

  async create(data: CreateModelData<M>): Promise<ModelData<M>> {
    const instance = await (this.ModelClass as any).create(data);
    return instance.toJSON();
  }

  async update(
    id: string,
    data: UpdateModelData<M>
  ): Promise<ModelData<M> | null> {
    const instance = await (this.ModelClass as any).load(id);
    if (!instance) return null;

    await instance.update(data);
    return instance.toJSON();
  }

  async delete(id: string): Promise<void> {
    await (this.ModelClass as any).destroy(id);
  }
}

// Usage
const userRepo = new Repository(User);
const user = await userRepo.findById('user123');
await userRepo.create({ name: 'John', email: 'john@example.com' });
```

### React Hooks with Type Safety

```typescript
import { useState, useEffect } from 'react';
import { Model, ModelData } from 'ndfirestorm';

// Generic hook for any model
function useModel<M extends Model>(
  ModelClass: new () => M,
  id: string
): {
  data: ModelData<M> | null;
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<ModelData<M> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    (ModelClass as any)
      .find(id)
      .then((result: ModelData<M>) => {
        setData(result);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err);
        setLoading(false);
      });
  }, [id]);

  return { data, loading, error };
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error } = useModel(User, userId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

## 💡 Best Practices

1. **Export both interface and model** - Makes it easier to use
2. **Use CreateModelData for API inputs** - Prevents id/timestamp issues
3. **Use UpdateModelData for updates** - Ensures partial updates
4. **Use ModelData for return types** - Consistent typing
5. **Combine with validation libraries** - Like Zod or Yup

## 🎯 Type Utility Cheat Sheet

```typescript
import { User } from '@/models/User';
import {
  ModelData,
  InferModelType,
  CreateModelData,
  UpdateModelData,
} from 'ndfirestorm';

// Get the data type
type UserType = ModelData<User>;

// Infer from class
type UserType2 = InferModelType<typeof User>;

// Type for creating (no id, timestamps)
type CreateUser = CreateModelData<User>;

// Type for updating (partial, no id, createdAt)
type UpdateUser = UpdateModelData<User>;

// Use in functions
async function getUser(id: string): Promise<ModelData<User> | null> {
  return User.find(id);
}

async function createUser(data: CreateModelData<User>) {
  return User.create(data);
}

async function updateUser(id: string, data: UpdateModelData<User>) {
  const user = await User.load(id);
  await user?.update(data);
}
```

## 🔗 Next

- [Best Practices](./07-best-practices.md) - Tips and tricks
- [API Reference](./08-api-reference.md) - Complete API documentation
