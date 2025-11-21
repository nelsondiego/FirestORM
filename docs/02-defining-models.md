# Defining Models

## 📋 Basic Structure

A model in NDFirestORM consists of two parts:

1. **Interface** - Defines the data structure
2. **Class** - Extends `Model` and defines the collection

```typescript
import { Model } from 'ndfirestorm';

// 1. Interface with data structure
export interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Model class
export class User extends Model<UserData> {
  static collectionName = 'users';
}
```

## 🎯 Data Types

### Basic Types

```typescript
interface ProductData {
  id: string;
  name: string; // String
  price: number; // Number
  inStock: boolean; // Boolean
  tags: string[]; // Array
  metadata: {
    // Object
    weight: number;
    dimensions: {
      width: number;
      height: number;
    };
  };
  createdAt: Date; // Date (Firestore Timestamp)
  updatedAt: Date;
}
```

### Optional Types

```typescript
interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string; // Optional
  avatar?: string | null; // Optional or null
  bio?: string;
}
```

### Union Types (Enums)

```typescript
interface OrderData {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  paymentMethod: 'card' | 'cash' | 'transfer';
}
```

### Arrays of Objects

```typescript
interface CartData {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}
```

## 🏗️ Complex Models

### Model with Subdocuments

```typescript
interface AddressData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CompanyData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: AddressData; // Subdocument
  employees: number;
  founded: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Company extends Model<CompanyData> {
  static collectionName = 'companies';
}
```

### Model with References

```typescript
interface PostData {
  id: string;
  title: string;
  content: string;
  authorId: string; // Reference to User
  categoryId: string; // Reference to Category
  tags: string[];
  likes: number;
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Post extends Model<PostData> {
  static collectionName = 'posts';
}
```

### Model with Reference Arrays

```typescript
interface GymData {
  id: string;
  name: string;
  ownerId: string;
  staffIds: string[]; // Array of references to User
  memberIds: string[]; // Array of references to Member
  address: {
    street: string;
    city: string;
    country: string;
  };
  amenities: string[];
  rating: number;
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export class Gym extends Model<GymData> {
  static collectionName = 'gyms';
}
```

## 📦 Model Organization

### Recommended Folder Structure

```
src/
├── models/
│   ├── index.ts          # Re-exports all models
│   ├── User.ts
│   ├── Product.ts
│   ├── Order.ts
│   └── types/            # Shared types
│       ├── Address.ts
│       └── common.ts
├── services/             # Business logic
│   ├── userService.ts
│   └── orderService.ts
└── orm.ts               # ORM initialization
```

### index.ts File

```typescript
// src/models/index.ts
export { User, type UserData } from './User';
export { Product, type ProductData } from './Product';
export { Order, type OrderData } from './Order';
export { Gym, type GymData } from './Gym';
```

### Usage

```typescript
// In any file
import { User, type UserData } from '@/models';

const users: UserData[] = await User.all();
```

## 🎨 Design Patterns

### Pattern 1: Interface + Model in same file

```typescript
// models/User.ts
import { Model } from 'ndfirestorm';

export interface UserData {
  id: string;
  name: string;
  email: string;
}

export class User extends Model<UserData> {
  static collectionName = 'users';
}
```

### Pattern 2: Separate types

```typescript
// models/types/UserTypes.ts
export interface UserData {
  id: string;
  name: string;
  email: string;
}

// models/User.ts
import { Model } from 'ndfirestorm';
import { UserData } from './types/UserTypes';

export class User extends Model<UserData> {
  static collectionName = 'users';
}
```

### Pattern 3: With shared types

```typescript
// models/types/common.ts
export interface Address {
  street: string;
  city: string;
  country: string;
}

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// models/User.ts
import { Model } from 'ndfirestorm';
import { Address, Timestamps } from './types/common';

export interface UserData extends Timestamps {
  id: string;
  name: string;
  email: string;
  address: Address;
}

export class User extends Model<UserData> {
  static collectionName = 'users';
}
```

## 🔧 Custom Methods

### Static Methods (Scopes)

```typescript
export class User extends Model<UserData> {
  static collectionName = 'users';

  // Scope for active users
  static active() {
    return this.where('status', '==', 'active');
  }

  // Scope for verified users
  static verified() {
    return this.where('emailVerified', '==', true);
  }

  // Custom method
  static async findByEmail(email: string) {
    return this.where('email', '==', email).first();
  }
}

// Usage
const activeUsers = await User.active().get();
const verifiedUsers = await User.verified().get();
const user = await User.findByEmail('john@example.com');
```

### Instance Methods

```typescript
export class User extends Model<UserData> {
  static collectionName = 'users';

  // Custom getter
  get fullName(): string {
    const data = this.toJSON();
    return `${data.firstName} ${data.lastName}`;
  }

  // Custom method
  async activate(): Promise<void> {
    await this.update({ status: 'active' });
  }

  async deactivate(): Promise<void> {
    await this.update({ status: 'inactive' });
  }

  isActive(): boolean {
    return this.get('status') === 'active';
  }
}

// Usage
const user = await User.load('user123');
if (user) {
  console.log(user.fullName);
  await user.activate();
  console.log(user.isActive()); // true
}
```

## 📝 Complete Examples

### Complete User Model

```typescript
// models/User.ts
import { Model } from 'ndfirestorm';

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'banned';
  emailVerified: boolean;
  lastLoginAt?: Date;
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    theme: 'light' | 'dark';
  };
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Model<UserData> {
  static collectionName = 'users';

  // Scopes
  static active() {
    return this.where('status', '==', 'active');
  }

  static admins() {
    return this.where('role', '==', 'admin');
  }

  static verified() {
    return this.where('emailVerified', '==', true);
  }

  // Custom methods
  static async findByEmail(email: string) {
    return this.where('email', '==', email).first();
  }

  // Getters
  get fullName(): string {
    const data = this.toJSON();
    return `${data.firstName} ${data.lastName}`;
  }

  // Instance methods
  async verify(): Promise<void> {
    await this.update({ emailVerified: true });
  }

  async ban(): Promise<void> {
    await this.update({ status: 'banned' });
  }

  isAdmin(): boolean {
    return this.get('role') === 'admin';
  }
}
```

### Product Model with Inventory

```typescript
// models/Product.ts
import { Model } from 'ndfirestorm';

export interface ProductData {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  category: string;
  tags: string[];
  images: string[];
  variants: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
  }>;
  status: 'draft' | 'active' | 'archived';
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Product extends Model<ProductData> {
  static collectionName = 'products';

  // Scopes
  static published() {
    return this.where('published', '==', true);
  }

  static inStock() {
    return this.where('stock', '>', 0);
  }

  // Methods
  static async findBySku(sku: string) {
    return this.where('sku', '==', sku).first();
  }

  // Getters
  get isLowStock(): boolean {
    const data = this.toJSON();
    return data.stock <= data.lowStockThreshold;
  }

  get isOnSale(): boolean {
    const data = this.toJSON();
    return !!data.compareAtPrice && data.compareAtPrice > data.price;
  }

  get discount(): number {
    const data = this.toJSON();
    if (!data.compareAtPrice) return 0;
    return ((data.compareAtPrice - data.price) / data.compareAtPrice) * 100;
  }

  // Instance methods
  async publish(): Promise<void> {
    await this.update({
      published: true,
      publishedAt: new Date(),
      status: 'active',
    });
  }

  async unpublish(): Promise<void> {
    await this.update({
      published: false,
      status: 'draft',
    });
  }

  async decreaseStock(quantity: number): Promise<void> {
    const currentStock = this.get('stock') || 0;
    await this.update({ stock: currentStock - quantity });
  }

  async increaseStock(quantity: number): Promise<void> {
    const currentStock = this.get('stock') || 0;
    await this.update({ stock: currentStock + quantity });
  }
}
```

## 💡 Best Practices

1. **Always export both interface and model**
2. **Use descriptive names for collections**
3. **Define union types for states/enums**
4. **Group related models in folders**
5. **Create scopes for common queries**
6. **Document custom methods**
7. **Use getters for computed properties**

## 🔗 Next

- [Queries](./03-queries.md) - Learn to query data
- [CRUD Operations](./04-crud-operations.md) - Basic operations
