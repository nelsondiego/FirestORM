# NDFirestORM Examples

This directory contains comprehensive examples demonstrating all features of NDFirestORM.

## 📚 Examples Overview

### Getting Started

#### [basic-usage.ts](./basic-usage.ts)

**Fundamental CRUD operations**

- Creating documents
- Reading with queries and pagination
- Updating documents (by ID and with model instances)
- Deleting documents

Perfect for getting started with the ORM.

#### [numeric-ids.ts](./numeric-ids.ts)

**Working with numeric document IDs**

- Find, load, create with numeric IDs
- Update and delete by numeric ID
- Batch and transaction operations with numbers
- Subcollections with numeric parent IDs
- Mixed string/numeric ID support
- Preserving numeric fields in data

Perfect for SQL migrations or working with external APIs that use numeric identifiers.

---

### Type Safety

#### [typescript-inference.ts](./typescript-inference.ts)

**Automatic type inference**

- No need for explicit type annotations
- Full IntelliSense and autocomplete support
- Type-safe queries, updates, and deletes
- Compile-time error checking

#### [with-types.ts](./with-types.ts)

**Type utility helpers**

- `ModelData<M>`: Extract data type from model
- `InferModelType<T>`: Infer type from model class
- `CreateModelData<M>`: Type for creating (without id, timestamps)
- `UpdateModelData<M>`: Type for updating (partial, without id)

---

### Queries & Pagination

#### [pagination.ts](./pagination.ts)

**Three pagination strategies**

1. **Standard Pagination** - With total count and page numbers (best for traditional pagination)
2. **Simple Pagination** - Cursor-based without total count (more efficient)
3. **Cursor Pagination** - Bidirectional with before/after cursors (best for infinite scroll)

---

### Real-time & Transactions

#### [realtime-transactions.ts](./realtime-transactions.ts)

**Real-time subscriptions and atomic operations**

- Real-time subscriptions for single documents and queries
- Atomic transactions for consistent multi-document updates
- Batch operations for efficient bulk writes
- Custom document IDs for Firebase Auth sync
- React and Vue integration patterns

---

### Subcollections

#### [subcollections-example.ts](./subcollections-example.ts)

**Working with nested collections**

- Accessing subcollections from parent documents
- Querying subcollection data with filters
- Real-time subscriptions on subcollections
- Batch delete operations on subcollections
- Static and instance-based subcollection access

#### [subcollection-crud.ts](./subcollection-crud.ts)

**Complete CRUD operations on subcollections**

- CREATE: Add documents to subcollections with custom IDs
- READ: Find and query subcollection documents
- UPDATE: Modify subcollection documents by ID
- DELETE: Remove individual or all subcollection documents

#### [typed-subcollections.ts](./typed-subcollections.ts)

**Type-safe subcollection operations**

- Define subcollection models with their own interfaces
- Access subcollections with full TypeScript type inference
- Get autocomplete and IntelliSense for all subcollection properties
- Type-safe CRUD operations on nested collections

---

### Advanced Operations

#### [batch-by-id.ts](./batch-by-id.ts)

**Cost-optimized batch operations**

- Update documents by ID without loading them first (saves read operations)
- Delete documents by ID in batch (50% cost reduction)
- Mixed batch operations (create, update, delete)
- Transaction operations by ID
- Bulk updates with proper batching (500 docs per batch)

**Key benefit:** Reduces Firestore operations by 50% when updating/deleting multiple documents.

#### [atomic-cascade-delete.ts](./atomic-cascade-delete.ts)

**Atomic deletion of documents with subcollections**

- Delete parent document and all subcollections in one atomic transaction
- Custom logic before deletion (e.g., delete related collections)
- Prevents orphaned data in subcollections
- Either everything succeeds or nothing changes (true atomicity)

Critical for maintaining data consistency when deleting complex document hierarchies.

#### [field-values.ts](./field-values.ts)

**Atomic field operations**

- `increment/decrement`: Atomic numeric operations (prevents race conditions)
- `arrayUnion`: Add elements to arrays without duplicates
- `arrayRemove`: Remove elements from arrays
- `deleteField`: Remove fields from documents
- `serverTimestamp`: Set fields to server timestamp

These operations are atomic and don't require reading the document first, making them perfect for concurrent updates like credits, likes, or tags.

---

## 🚀 Running Examples

Each example is a standalone TypeScript file. To run an example:

1. Install dependencies:

```bash
npm install
```

2. Configure Firebase:
   - Update the Firebase config in each example with your project credentials
   - Or create a `.env` file with your Firebase config

3. Run with ts-node:

```bash
npx ts-node examples/basic-usage.ts
```

Or compile and run:

```bash
npm run build
node dist/examples/basic-usage.js
```

## 📖 Documentation

For detailed documentation, see the [docs](../docs/README.md) directory:

- [Getting Started](../docs/01-getting-started.md)
- [Defining Models](../docs/02-defining-models.md)
- [Queries](../docs/03-queries.md)
- [CRUD Operations](../docs/04-crud-operations.md)
- [Pagination](../docs/05-pagination.md)
- [Type Utilities](../docs/06-type-utilities.md)
- [Real-time, Transactions & Batch](../docs/07-realtime-transactions.md)
- [Best Practices](../docs/08-best-practices.md)
- [Subcollections](../docs/09-subcollections.md)
- [Field Value Utilities](../docs/10-field-values.md)
- [Numeric ID Support](../docs/11-numeric-ids.md)

## 💡 Tips

- Start with `basic-usage.ts` to understand the fundamentals
- Check `typescript-inference.ts` to see how types work automatically
- Use `batch-by-id.ts` patterns to optimize Firestore costs
- Refer to `field-values.ts` for atomic operations that prevent race conditions
- Study `atomic-cascade-delete.ts` for complex deletion scenarios

## 🆘 Need Help?

- 📖 [Full Documentation](../docs/README.md)
- 🐛 [Issue Tracker](https://github.com/nelsondiego/FirestORM/issues)
- 💬 [Discussions](https://github.com/nelsondiego/FirestORM/discussions)
