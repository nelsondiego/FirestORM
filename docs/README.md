# NDFirestORM Documentation

Complete documentation for NDFirestORM - An Eloquent-style ORM for Firebase Firestore with TypeScript.

## 📚 Table of Contents

### Getting Started

1. [**Getting Started**](./01-getting-started.md)
   - Installation
   - Initial setup
   - Your first model
   - Key concepts

### Core Concepts

2. [**Defining Models**](./02-defining-models.md)
   - Basic structure
   - Data types
   - Complex models
   - Model organization
   - Custom methods

3. [**Queries**](./03-queries.md)
   - Basic queries
   - Where clauses
   - Ordering and limiting
   - Query scopes
   - Advanced queries

4. [**CRUD Operations**](./04-crud-operations.md)
   - Create
   - Read
   - Update
   - Delete
   - Complete examples

5. [**Pagination**](./05-pagination.md)
   - Standard pagination
   - Simple pagination
   - Cursor pagination
   - Use cases and examples

### Advanced Topics

6. [**Type Utilities**](./06-type-utilities.md)
   - ModelData
   - InferModelType
   - CreateModelData
   - UpdateModelData
   - Complete examples

7. [**Real-time, Transactions & Batch**](./07-realtime-transactions.md)
   - Real-time subscriptions
   - Atomic transactions
   - Batch operations
   - Custom document IDs
   - Complete examples

8. [**Best Practices**](./08-best-practices.md)
   - General principles
   - CRUD patterns
   - Transaction best practices
   - Performance optimization
   - Code organization

9. [**Subcollections**](./09-subcollections.md)
   - Accessing subcollections
   - Querying nested data
   - Real-time subscriptions
   - Batch delete operations
   - Complete deletion examples

10. [**Field Value Utilities**](./10-field-values.md)
    - Atomic field operations
    - Increment/decrement numbers
    - Array operations (union, remove)
    - Delete fields
    - Server timestamps
    - Preventing race conditions

11. [**Numeric ID Support**](./11-numeric-ids.md)
    - Using numeric IDs
    - Find, load, create with numbers
    - Batch and transaction support
    - Subcollections with numeric IDs
    - Mixed string/numeric IDs
    - Best practices

## 🚀 Quick Start

```bash
# Install
npm install ndfirestorm firebase

# Initialize
import { initializeOrm } from 'ndfirestorm';
import { getFirestore } from 'firebase/firestore';

initializeOrm(getFirestore());

# Define Model
interface UserData {
  id: string;
  name: string;
  email: string;
}

class User extends Model<UserData> {
  static collectionName = 'users';
}

# Use It
const users = await User.all();
const user = await User.find('id');
```

## 📖 Documentation Structure

Each guide builds on the previous one:

1. **Start here** → [Getting Started](./01-getting-started.md)
2. **Learn to model** → [Defining Models](./02-defining-models.md)
3. **Query data** → [Queries](./03-queries.md)
4. **Manipulate data** → [CRUD Operations](./04-crud-operations.md)
5. **Handle large datasets** → [Pagination](./05-pagination.md)
6. **Master TypeScript** → [Type Utilities](./06-type-utilities.md)
7. **Real-time & Transactions** → [Real-time, Transactions & Batch](./07-realtime-transactions.md)
8. **Best Practices** → [Best Practices](./08-best-practices.md)
9. **Nested Collections** → [Subcollections](./09-subcollections.md)
10. **Atomic Operations** → [Field Value Utilities](./10-field-values.md)
11. **Numeric IDs** → [Numeric ID Support](./11-numeric-ids.md)

## 🎯 Key Features

- **JSON First** - Returns plain objects by default (faster, API-ready)
- **ID Auto-included** - Document ID always in the object
- **Type Safe** - Full TypeScript support with type utilities
- **Query Builder** - Fluent, chainable API
- **3 Pagination Types** - Standard, simple, and cursor-based
- **Real-time Subscriptions** - Live updates with `listen()`
- **Transactions & Batch** - Atomic operations and bulk writes
- **Subcollections** - Full support for nested collections
- **Field Value Utilities** - Atomic increment, array operations, and more
- **Numeric ID Support** - Work with both string and numeric document IDs
- **Zero Overhead** - No unnecessary class instantiation

## 💡 Quick Examples

### Create

```typescript
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
});
```

### Read

```typescript
const users = await User.all();
const user = await User.find('id');
const activeUsers = await User.where('status', '==', 'active').get();
```

### Update

```typescript
const user = await User.load('id');
await user?.update({ name: 'Jane Doe' });
```

### Delete

```typescript
const user = await User.load('id');
await user?.delete();
```

### Paginate

```typescript
const result = await User.paginate({ perPage: 20, page: 1 });
console.log(result.data); // Users
console.log(result.meta); // Pagination info
```

### Atomic Operations

```typescript
import { increment, arrayUnion, arrayRemove } from 'ndfirestorm';

// Increment credits atomically
await User.update('id', { credits: increment(10) });

// Add tags without duplicates
await User.update('id', { tags: arrayUnion('premium', 'verified') });

// Remove tags
await User.update('id', { tags: arrayRemove('trial') });
```

## 🔗 External Resources

- [GitHub Repository](https://github.com/nelsondiego/FirestORM)
- [NPM Package](https://www.npmjs.com/package/ndfirestorm)
- [Firebase Documentation](https://firebase.google.com/docs/firestore)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🆘 Getting Help

- **Issues**: [GitHub Issues](https://github.com/nelsondiego/FirestORM/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nelsondiego/FirestORM/discussions)

## 📝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## 📄 License

MIT © Diego Nelson
