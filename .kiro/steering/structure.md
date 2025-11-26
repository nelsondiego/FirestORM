# Project Structure

## Directory Organization

```
ndfirestorm/
├── src/                    # Source code
│   ├── core/              # Core ORM classes
│   │   ├── Model.ts       # Base model class (1189 lines)
│   │   ├── QueryBuilder.ts # Query builder with fluent API
│   │   ├── Collection.ts  # Collection wrapper
│   │   └── ModelFactory.ts # ORM initialization
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts       # Shared types
│   ├── utils/             # Utility functions
│   │   └── fieldValues.ts # Firestore field value helpers
│   ├── errors/            # Custom error classes
│   │   ├── ModelNotFoundError.ts
│   │   └── ValidationError.ts
│   └── index.ts           # Main entry point (exports)
├── dist/                  # Build output (generated)
├── docs/                  # User documentation
│   ├── 01-getting-started.md
│   ├── 02-defining-models.md
│   ├── 03-queries.md
│   ├── 04-crud-operations.md
│   ├── 05-pagination.md
│   ├── 06-type-utilities.md
│   ├── 07-realtime-transactions.md
│   ├── 08-best-practices.md
│   ├── 09-subcollections.md
│   ├── 10-field-values.md
│   ├── 11-numeric-ids.md
│   └── README.md
├── examples/              # Runnable examples
│   ├── basic-usage.ts
│   ├── typescript-inference.ts
│   ├── with-types.ts
│   ├── pagination.ts
│   ├── realtime-transactions.ts
│   ├── subcollections-example.ts
│   ├── subcollection-crud.ts
│   ├── typed-subcollections.ts
│   ├── batch-by-id.ts
│   ├── atomic-cascade-delete.ts
│   ├── field-values.ts
│   ├── numeric-ids.ts
│   └── README.md
├── tests/                 # Test files
│   └── Collection.test.ts
├── doc_internals/         # Internal planning docs
│   ├── FIRESTORE_ORM_PLAN.md
│   └── NPM_LIBRARY_PLAN.md
└── [config files]         # Build/lint/test configs
```

## Core Architecture

### Model.ts (Base Class)

- Abstract base class for all models
- Static methods for queries (find, all, where, create, update, destroy)
- Instance methods for CRUD (save, update, delete, refresh)
- Transaction and batch operation support
- Real-time subscription methods
- Subcollection access (static and instance)
- Type utilities and helpers

### QueryBuilder.ts

- Fluent query API (where, orderBy, limit, offset)
- Pagination methods (paginate, simplePaginate, cursorPaginate)
- Aggregation methods (count, exists)
- Real-time listeners
- Batch delete (deleteAll)
- Returns JSON by default

### Collection.ts

- Wrapper around Firestore CollectionReference
- Handles document conversion
- Manages timestamps

### ModelFactory.ts

- ORM initialization
- Firestore instance management
- Global configuration

## File Naming Conventions

- **Source files**: PascalCase for classes (Model.ts, QueryBuilder.ts)
- **Type files**: lowercase for utilities (index.ts)
- **Documentation**: Numbered with descriptive names (01-getting-started.md)
- **Examples**: kebab-case with descriptive names (basic-usage.ts)
- **Config files**: Standard names with .mjs extension for ES modules

## Code Organization Principles

1. **Separation of Concerns**: Core logic, types, utilities, and errors in separate directories
2. **Single Responsibility**: Each class has a clear, focused purpose
3. **Type Safety**: TypeScript types defined alongside implementation
4. **Documentation**: Comprehensive docs with examples for every feature
5. **Examples**: Runnable code demonstrating real-world usage patterns
