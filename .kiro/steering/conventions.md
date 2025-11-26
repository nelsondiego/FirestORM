# Code Conventions & Style

## TypeScript Style

### Type Definitions

- Use interfaces for data structures: `interface UserData { ... }`
- Use type aliases for unions and utilities: `type ModelData<M> = ...`
- Generic types use single uppercase letters or descriptive names: `<M extends Model>`, `<T extends ModelAttributes>`
- Always export types that users will reference

### Naming Conventions

- **Classes**: PascalCase (Model, QueryBuilder, TransactionContext)
- **Methods**: camelCase (find, findOrFail, getCollectionRef)
- **Static properties**: camelCase (collectionName)
- **Type parameters**: Single uppercase letter or descriptive (M, T, SubM)
- **Interfaces**: PascalCase with "Data" suffix for model data (UserData, EquipmentData)

### Method Signatures

- Use method overloading for different parameter combinations
- Document each overload with JSDoc comments
- Example:
  ```typescript
  /**
   * Update a document
   * @overload Update by model instance
   */
  async update<M extends Model>(model: M, data: Partial<any>): Promise<M>;
  /**
   * Update a document
   * @overload Update by ID
   */
  async update<M extends Model>(
    ModelClass: ModelConstructor<M>,
    id: string | number,
    data: Partial<any>
  ): Promise<void>;
  ```

## API Design Principles

### JSON First

- Query methods return plain objects by default (find, all, first, get)
- Model instances only when needed (create returns instance, load returns instance)
- Rationale: Faster, API-ready, no unnecessary class instantiation

### ID Handling

- Always include document ID in returned objects
- Support both string and numeric IDs in API
- Normalize to strings internally (Firestore requirement)
- Use `normalizeId()` helper at Firestore boundary

### Method Naming

- **find**: Returns JSON or null
- **load**: Returns model instance or null
- **findOrFail**: Returns JSON or throws error
- **create**: Returns model instance (for immediate use)
- **update**: Static method updates by ID, instance method updates self
- **destroy**: Static method deletes by ID
- **delete**: Instance method deletes self

## Code Style

### ESLint Rules

- `@typescript-eslint/no-explicit-any`: OFF (necessary for generic ORM)
- `@typescript-eslint/explicit-module-boundary-types`: OFF
- `@typescript-eslint/no-unused-vars`: WARN (except args prefixed with `_`)

### Formatting

- Use Prettier for consistent formatting
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas in multiline objects/arrays
- Semicolons required

### Comments

- Use JSDoc for public API methods
- Include `@param`, `@returns`, `@example` tags
- Add inline comments for complex logic
- Document "why" not "what" for non-obvious code

## Error Handling

### Custom Errors

- Extend Error class for domain-specific errors
- Use descriptive error messages
- Examples: ModelNotFoundError, ValidationError

### Error Messages

- Be specific and actionable
- Include relevant context (IDs, field names)
- Example: `"Cannot delete a model that does not exist"`
- Example: `"Model not found with id: ${id}"`

## Testing

### Test Organization

- One test file per source file (Collection.test.ts for Collection.ts)
- Group related tests with describe blocks
- Use descriptive test names: "should return null when document not found"

### Test Coverage

- Aim for comprehensive coverage of public API
- Test edge cases and error conditions
- Mock Firestore operations for unit tests

## Documentation

### User Documentation (docs/)

- Numbered files for sequential reading (01-getting-started.md)
- Each doc covers one major feature
- Include code examples for every concept
- Show both basic and advanced usage

### Examples (examples/)

- Runnable, self-contained code
- JSDoc comment at top explaining purpose
- Cover real-world use cases
- Demonstrate best practices

### README

- Clear value proposition at top
- Quick start guide (3 steps or less)
- Feature list with examples
- API reference with descriptions
- Real-world integration examples (React, Vue, Next.js, Express)
