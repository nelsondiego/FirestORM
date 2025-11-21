# Changelog

## [Unreleased]

## [0.2.0] - 2025-11-21

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
