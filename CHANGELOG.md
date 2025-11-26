# Changelog

## [Unreleased]

## [0.1.16] - 2025-11-26

### Documentation

- **Complete Documentation Overhaul**: Comprehensive documentation improvements across all files
  - Added descriptive headers to all API Reference sections in README
  - Created `examples/README.md` with organized index of all examples
  - Added JSDoc comments to all example files explaining their purpose
  - Updated `docs/README.md` to include Field Value Utilities (point 10)
  - Improved README introduction with "Why NDFirestORM?" section
  - Added "What Makes NDFirestORM Different?" section with 4 key differentiators
  - Expanded "Real-World Examples" section with React, Vue, Next.js, Express, and Firebase Auth patterns
  - Added performance and TypeScript support sections
  - Included community resources and roadmap

- **Example Files**: All examples now have clear descriptions
  - `basic-usage.ts` - Fundamental CRUD operations
  - `typescript-inference.ts` - Automatic type inference
  - `with-types.ts` - Type utility helpers
  - `pagination.ts` - Three pagination strategies
  - `realtime-transactions.ts` - Real-time and atomic operations
  - `subcollections-example.ts` - Working with nested collections
  - `subcollection-crud.ts` - Complete CRUD on subcollections
  - `typed-subcollections.ts` - Type-safe subcollection operations
  - `batch-by-id.ts` - Cost-optimized batch operations
  - `atomic-cascade-delete.ts` - Atomic deletion with subcollections
  - `field-values.ts` - Atomic field operations

- **API Reference**: Each section now has a brief, clear description
  - Query Methods - "Build queries with a fluent, chainable interface"
  - CRUD Operations - "Create, read, update, and delete documents with simple methods"
  - Pagination - "Three pagination strategies for different use cases"
  - Real-time Subscriptions - "Listen to live updates with automatic JSON conversion"
  - Transactions - "Execute multiple operations atomically"
  - Batch Operations - "Perform bulk writes efficiently"
  - Subcollections - "Full CRUD support for nested collections with type safety"
  - Atomic Cascade Delete - "Delete documents with all subcollections in one atomic transaction"
  - Field Value Utilities - "Atomic field operations without reading documents first"
  - Custom IDs - "Create documents with custom IDs (perfect for Firebase Auth sync)"

### Fixed

- **TypeScript Errors**: Fixed type safety issues in `atomic-cascade-delete.ts`
  - Added proper null checks for document IDs before using them
  - Prevents `string | undefined` type errors
  - All examples now compile without TypeScript errors

### Improved

- **Developer Experience**: Better onboarding and discoverability
  - Clear navigation between documentation sections
  - Organized examples by category (Getting Started, Type Safety, Queries, etc.)
  - Quick links to relevant documentation from examples
  - Improved README structure with better visual hierarchy

## [0.1.15] - 2025-11-25

### Added

- **Firestore Field Value Utilities**: Atomic field operations support
  - `increment(n)` - Atomically increment/decrement numeric fields
  - `arrayUnion(...elements)` - Add elements to arrays (no duplicates)
  - `arrayRemove(...elements)` - Remove elements from arrays
  - `deleteField()` - Delete a field from a document
  - `serverTimestamp()` - Set field to server timestamp
  - All utilities work with `Model.update()`, `query.update()`, and subcollections
  - Example: `await User.update('id', { credits: increment(10), tags: arrayUnion('premium') })`
  - Enables atomic operations without reading documents first
  - Prevents race conditions in concurrent updates

### Documentation

- Added `docs/10-field-values.md` with comprehensive field value utilities guide
- Added `examples/field-values.ts` with real-world examples
- Documented all field value functions with use cases and best practices

## [0.1.14] - 2025-11-25

### Added

- **Typed Subcollections**: Full TypeScript support for subcollection models
  - Define subcollection models with their own interfaces
  - `gym.subcollection(Equipment)` - Access typed subcollection
  - `Gym.subcollection('gym123', Equipment)` - Static typed access
  - Full type inference for all operations (create, find, update, delete, query)
  - Example: `const equipments = await gym.subcollection(Equipment).get()` → `equipments` is `EquipmentData[]`
  - Autocomplete and IntelliSense for all subcollection properties
  - Backwards compatible with string-based subcollections
  - Method overloading for both string and Model-based access

### Documentation

- Updated `docs/09-subcollections.md` with typed subcollection examples
- Added `examples/typed-subcollections.ts` with comprehensive typed subcollection examples
- Updated `README.md` with typed subcollection example

## [0.1.13] - 2025-11-25

### Added

- **Subcollection CRUD Operations**: Complete CRUD support for subcollections
  - `query.create(data, customId?)` - Create document in subcollection
  - `query.update(id, data)` - Update document in subcollection by ID
  - `query.destroy(id)` - Delete document in subcollection by ID
  - `query.find(id)` - Find document in subcollection by ID
  - Works with both instance and static methods
  - Example: `await gym.subcollection('equipments').create({ name: 'Treadmill', quantity: 5 })`
  - Example: `await Gym.subcollection('gym123', 'equipments').update('eq1', { quantity: 10 })`
  - Supports custom IDs for predictable document references
  - Automatically adds timestamps (createdAt, updatedAt)

### Documentation

- Updated `docs/09-subcollections.md` with complete CRUD examples
- Added `examples/subcollection-crud.ts` with comprehensive subcollection operations
- Documented all new methods with usage examples

## [0.1.12] - 2025-11-25

### Fixed

- **TypeScript Type Inference**: Fixed return types for query builder methods
  - `Model.query()` now returns `QueryBuilder<M>` instead of `any`
  - `Model.where()` now returns `QueryBuilder<M>` instead of `any`
  - `Model.subcollection()` now returns `QueryBuilder<M>` instead of `any`
  - `model.subcollection()` now returns `QueryBuilder<M>` instead of `any`
  - Now TypeScript correctly infers types without explicit annotations
  - Example: `const users = await User.where(...).get()` → `users` is `UserData[]` ✅

### Verified Type Safety

All methods now have proper TypeScript type inference:

**Static Methods (Model):**

- ✅ `Model.find(id)` → `Promise<ModelData<M> | null>`
- ✅ `Model.findOrFail(id)` → `Promise<ModelData<M>>`
- ✅ `Model.load(id)` → `Promise<M | null>`
- ✅ `Model.all()` → `Promise<ModelData<M>[]>`
- ✅ `Model.create(data)` → `Promise<M>`
- ✅ `Model.update(id, data)` → `Promise<void>`
- ✅ `Model.destroy(id)` → `Promise<void>`
- ✅ `Model.query()` → `QueryBuilder<M>`
- ✅ `Model.where(...)` → `QueryBuilder<M>`
- ✅ `Model.subcollection(...)` → `QueryBuilder<M>`

**Query Builder Methods:**

- ✅ `query.get()` → `Promise<ModelData<M>[]>`
- ✅ `query.first()` → `Promise<ModelData<M> | null>`
- ✅ `query.firstOrFail()` → `Promise<ModelData<M>>`
- ✅ `query.find(id)` → `Promise<ModelData<M> | null>`
- ✅ `query.count()` → `Promise<number>`
- ✅ `query.exists()` → `Promise<boolean>`
- ✅ `query.paginate()` → `Promise<PaginatedResult<ModelData<M>>>`
- ✅ `query.listen(callback)` → `Unsubscribe`
- ✅ `query.deleteAll()` → `Promise<number>`

### Documentation

- Added `examples/typescript-inference.ts` with comprehensive type inference examples
- Demonstrates that no explicit type annotations are needed in v0.1.12+

## [0.1.11] - 2025-11-25

### Added

- **ID-based Batch Operations**: Update and delete by ID in batch/transaction contexts
  - `ctx.update(ModelClass, id, data)` - Update by ID in batch/transaction
  - `ctx.delete(ModelClass, id)` - Delete by ID in batch/transaction
  - Reduces operations: No need to load documents first (saves read operations)
  - Example: `ctx.update(User, 'user123', { status: 'active' })`
  - Example: `ctx.delete(User, 'user123')`
  - Works in both `Model.batch()` and `Model.transaction()`
  - **Cost optimization**: 1 write instead of 1 read + 1 write
  - Saves 50% of operations when updating/deleting multiple documents

### Documentation

- Updated `docs/08-best-practices.md` with ID-based batch operation examples
- Updated `docs/07-realtime-transactions.md` with ID-based batch/transaction examples
- Added `examples/batch-by-id.ts` with comprehensive cost optimization examples
- Documented how ID-based operations save read operations and reduce costs

## [0.1.10] - 2025-11-25

### Added

- **Static Update Method**: Update documents by ID without loading
  - `Model.update(id, data)` - Update document directly by ID
  - Faster than loading and updating for simple changes
  - Automatically adds `updatedAt` timestamp
  - Example: `await User.update('user123', { name: 'New Name', age: 30 })`
  - Use when you don't need validation, hooks, or the model instance
  - For complex updates with validation, use `model.update(data)` instead

### Documentation

- Updated `docs/04-crud-operations.md` with static update method examples
- Added comparison tables for update and delete methods
- Updated `docs/08-best-practices.md` with best practices for static methods
- Updated `examples/basic-usage.ts` with new update patterns
- Added quick reference guide for CRUD operations
- **Added cost optimization section** in `docs/07-realtime-transactions.md`
- Clarified that batch operations do NOT reduce Firestore costs (each operation is billed separately)
- Added cost-effective patterns and operation count comparisons

## [0.1.9] - 2025-11-24

### Added

- **Atomic Subcollection Deletion**: Delete subcollections within transactions for true atomicity
  - `ctx.deleteSubcollection(model, 'subcollectionName')` - Delete subcollection in transaction
  - `ctx.deleteCascade(model, options)` - Delete model with subcollections and custom logic
  - Solves the problem of orphaned data when deleting documents with subcollections
  - All operations are atomic - either everything succeeds or nothing changes
  - Example: `await ctx.deleteCascade(gym, { subcollections: ['equipments', 'members'] })`
  - Supports `onBeforeDelete` hook for deleting related collections
  - Works within the 500 document transaction limit
  - For larger datasets, use `deleteAll()` (batch) then transaction

### Documentation

- Updated `docs/09-subcollections.md` with atomic deletion examples
- Updated `docs/07-realtime-transactions.md` with cascade delete patterns
- Added comprehensive example: `examples/atomic-cascade-delete.ts`
- Added migration guide for atomic vs non-atomic deletion patterns

## [0.1.8] - 2025-11-21

### Added

- **Subcollection Support**: Access nested collections in Firestore
  - `Model.subcollection(parentId, name)` - Static method to access subcollections
  - `model.subcollection(name)` - Instance method to access subcollections
  - Full QueryBuilder support (where, orderBy, limit, listen, etc.)
  - Example: `const equipments = await gym.subcollection('equipments').get()`
  - Example: `await Gym.subcollection('gym123', 'equipments').where('status', '==', 'active').get()`

- **Batch Delete**: Delete all documents matching a query
  - `QueryBuilder.deleteAll()` - Delete all documents in query results
  - Automatically handles batching (500 docs per batch)
  - Works with subcollections
  - Example: `await User.where('status', '==', 'inactive').deleteAll()`
  - Example: `await gym.subcollection('equipments').deleteAll()`

### Fixed

- TypeScript spread type errors in QueryBuilder
- DocumentSnapshot type compatibility issues

## [0.1.7] - 2025-11-21

### Fixed

- **ESM Build Issue**: Fixed critical error in Vite applications
  - Removed `require()` from `Model.query()` method
  - Changed to proper ES module import of `QueryBuilder`
  - Fixes error: "Could not resolve './QueryBuilder' in node_modules/ndfirestorm/dist/index.esm.js"
  - Now fully compatible with Vite and other ESM-only bundlers

## [0.1.6] - 2025-11-21

### Added

- **Real-time Subscriptions**: New `listen()` methods for real-time updates
  - `Model.listen(id, callback)` - Listen to a single document
  - `QueryBuilder.listen(callback)` - Listen to query results
  - Returns `Unsubscribe` function for cleanup
  - **JSON First**: Callback receives plain JSON data (not model instance)
  - Built-in error handling
  - Examples:
    - Single document: `User.listen('id', (user) => console.log(user.name))`
    - Query results: `User.where('role', '==', 'admin').listen((admins) => console.log(admins))`

- **Transactions**: New `Model.transaction()` method for atomic operations
  - Run multiple reads and writes atomically
  - Automatic retry on conflicts
  - Support for return values
  - Example: `await User.transaction(async (firestore, transaction) => { ... })`

- **Batch Operations**: New `Model.batch()` method for bulk writes
  - Up to 500 operations per batch
  - More efficient than individual writes
  - Supports create, update, and delete
  - Example: `await User.batch(async (firestore, batch) => { ... })`

- **Custom Document IDs**: Support for custom IDs when creating documents
  - Pass custom ID as second parameter: `User.create(data, 'custom-id')`
  - Include ID in data object: `User.create({ id: 'custom-id', ...data })`
  - Set ID before saving: `user.set('id', 'custom-id'); await user.save()`
  - Perfect for syncing with Firebase Auth UIDs

### Changed

- **`create()` method**: Now accepts optional second parameter for custom ID
- **`performCreate()` method**: Now uses `setDoc()` when ID is provided, `addDoc()` otherwise

### Documentation

- Added comprehensive guide: `docs/07-realtime-transactions.md`
- Added examples: `examples/realtime-transactions.ts`
- Includes React and Vue examples for real-time subscriptions
- Transaction and batch operation patterns
- Custom ID usage examples

### Fixed

- **Type Visibility Issue**: Fixed TypeScript error when extending `Model` class
  - Changed `collectionName` from `protected static` to `static` (public)
- **Build Warning**: Fixed ES module warning by adding `"type": "module"` to package.json
  - Renamed config files to `.mjs` extension
  - Converted jest.config to ES module syntax
  - Changed `getCollectionRef()` from `protected static` to `static` (public)
  - This resolves the error: "The 'this' context of type 'typeof User' is not assignable to method's 'this' of type 'ModelConstructor<User>'"
  - No breaking changes - only makes the API more accessible

## [0.1.3] - 2025-11-21

### Breaking Changes

#### API Simplification

- **REMOVED**: `User.findModel(id)` → Use `User.load(id)` instead
- **REMOVED**: `User.allModels()` → Use `User.all()` (already returns JSON)
- **REMOVED**: `QueryBuilder.firstModel()` → Use `.first()` (already returns JSON)
- **REMOVED**: `QueryBuilder.getModels()` → Use `.get()` (already returns JSON)

#### Pagination API Changes

- **BREAKING**: `paginate()` now uses named parameters instead of positional
  - Before: `paginate(20, 1)`
  - After: `paginate({ perPage: 20, page: 1 })`
  - Default `perPage` changed from 15 to 10
  - Both parameters are now optional with defaults

- **BREAKING**: `simplePaginate()` now uses named parameters
  - Before: `simplePaginate(50, cursor)`
  - After: `simplePaginate({ perPage: 50, cursor })`
  - Default `perPage` changed from 15 to 10

- **BREAKING**: `cursorPaginate()` now uses named parameters
  - Before: `cursorPaginate(20, afterCursor, beforeCursor)`
  - After: `cursorPaginate({ perPage: 20, afterCursor, beforeCursor })`
  - Default `perPage` changed from 15 to 10

### Added

- **NEW**: `User.load(id)` - Loads a model instance for updates/deletes
  - Returns `Model | null`
  - Use for operations that need model instances (update, delete)
  - Example: `const user = await User.load('id'); await user?.update({ name: 'New' });`

- All pagination methods now support being called without parameters
  - `paginate()` - Uses 10 per page, page 1
  - `simplePaginate()` - Uses 10 per page, no cursor
  - `cursorPaginate()` - Uses 10 per page, no cursor

- Complete migration guide in `docs/MIGRATION_v0.2.0.md`

### Changed

- **Simplified API**: Clear distinction between JSON and instance methods
  - Query methods (`find`, `all`, `first`, `get`) return JSON (plain objects)
  - `create()` returns model instance (for immediate use)
  - `load()` returns model instance (for updates/deletes)

### Documentation

- Updated all documentation to reflect new API
- Added comprehensive migration guide
- Updated all examples to use `load()` instead of `findModel()`
- Added null safety examples with optional chaining
- Improved best practices sections

### Migration

See `docs/MIGRATION_v0.2.0.md` for detailed migration instructions.

Quick migration:

```bash
# Replace in all TypeScript files
find . -name "*.ts" -exec sed -i 's/\.findModel(/\.load(/g' {} +
find . -name "*.ts" -exec sed -i 's/\.allModels()/\.all()/g' {} +
find . -name "*.ts" -exec sed -i 's/\.firstModel()/\.first()/g' {} +
find . -name "*.ts" -exec sed -i 's/\.getModels()/\.get()/g' {} +
```

## [0.1.0] - 2025-01-21

### Added

- Initial release
- Core Model class with TypeScript generics
- QueryBuilder with fluent API
- Collection wrapper
- Three types of pagination:
  - Standard pagination with metadata
  - Simple cursor-based pagination
  - Bidirectional cursor pagination
- Type utilities:
  - `ModelData<M>` - Extract data type
  - `InferModelType<T>` - Infer from class
  - `CreateModelData<M>` - Type for creating
  - `UpdateModelData<M>` - Type for updating
- JSON-first approach (returns plain objects by default)
- ID auto-included in all results
- CRUD operations
- Query builder with where, orderBy, limit
- Timestamps support
- Soft deletes structure
- Complete TypeScript support
- Comprehensive documentation
