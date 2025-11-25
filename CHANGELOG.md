# Changelog

## [Unreleased]

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
