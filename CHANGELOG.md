# Changelog

## [Unreleased]

### Changed

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

- All pagination methods now support being called without parameters
  - `paginate()` - Uses 10 per page, page 1
  - `simplePaginate()` - Uses 10 per page, no cursor
  - `cursorPaginate()` - Uses 10 per page, no cursor

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
