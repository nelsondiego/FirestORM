# Numeric ID Support

> **⚠️ Important**: Firestore document IDs **must be strings**. This is a Firestore requirement, not a FirestORM limitation. This feature provides **convenience** by allowing you to use numbers in your code, which are automatically converted to strings before Firestore operations.

FirestORM allows you to work with numeric IDs in your code for convenience. When you use a number as an ID (e.g., `12345`), FirestORM automatically converts it to a string (`"12345"`) before interacting with Firestore.

## Overview

The `id` field in `ModelAttributes` now accepts both `string` and `number` types:

```typescript
export interface ModelAttributes {
  id?: string | number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
```

## Use Cases

Numeric IDs are particularly useful when:

- Migrating from SQL databases with auto-incrementing IDs
- Working with external APIs that use numeric identifiers
- Maintaining consistency with existing numeric ID systems
- Collections like `locations_cities` or `locations_provinces` that use numeric IDs

## Basic Usage

### Define a Model with Numeric ID

```typescript
import { Model, ModelAttributes } from 'ndfirestorm';

interface CityData extends ModelAttributes {
  id: number; // Numeric ID
  name: string;
  province: string;
  population?: number;
}

class City extends Model<CityData> {
  static collectionName = 'locations_cities';
}
```

### Find by Numeric ID

```typescript
// Find with numeric ID
const city = await City.find(12345);

// Also works with string (both are equivalent)
const sameCity = await City.find('12345');
```

### Load by Numeric ID

```typescript
// Load model instance with numeric ID
const cityInstance = await City.load(12345);
if (cityInstance) {
  console.log(cityInstance.toJSON());
}
```

### Create with Numeric ID

```typescript
// Create with custom numeric ID
const newCity = await City.create(
  {
    name: 'Jakarta',
    province: 'DKI Jakarta',
    population: 10000000,
  },
  54321 // Numeric custom ID
);
```

### Update by Numeric ID

```typescript
// Update using numeric ID
await City.update(12345, {
  population: 11000000,
});
```

### Delete by Numeric ID

```typescript
// Delete using numeric ID
await City.destroy(54321);
```

## Advanced Usage

### Queries with Numeric IDs

```typescript
// Query by numeric ID
const cities = await City.where('id', '==', 12345).get();

// Query by other numeric fields
const largeCities = await City.where('population', '>', 5000000).get();
```

### Real-time Listeners

```typescript
// Listen to changes on a document with numeric ID
const unsubscribe = City.listen(12345, (data) => {
  console.log('City updated:', data);
});

// Stop listening
unsubscribe();
```

### Batch Operations

```typescript
await City.batch(async (ctx) => {
  // Create with numeric IDs
  ctx.create(City, { name: 'Bandung', province: 'West Java' }, 11111);
  ctx.create(City, { name: 'Surabaya', province: 'East Java' }, 22222);

  // Update by numeric ID
  ctx.update(City, 12345, { population: 12000000 });

  // Delete by numeric ID
  ctx.delete(City, 11111);
});
```

### Transactions

```typescript
await City.transaction(async (ctx) => {
  // Load by numeric ID
  const city = await City.load(12345);
  if (city) {
    await ctx.update(city, {
      population: city.get('population')! + 1000,
    });
  }

  // Create with numeric ID
  await ctx.create(City, { name: 'Medan', province: 'North Sumatra' }, 33333);

  // Delete by numeric ID
  await ctx.delete(City, 22222);
});
```

### Subcollections with Numeric Parent IDs

```typescript
// Access subcollection using numeric parent ID
const districts = await City.subcollection(12345, 'districts').get();

// Create in subcollection
const newDistrict = await City.subcollection(12345, 'districts').create({
  name: 'Central District',
  area: 50.5,
});

// Update in subcollection
await City.subcollection(12345, 'districts').update('district-1', {
  area: 55.0,
});

// Delete from subcollection
await City.subcollection(12345, 'districts').destroy('district-1');
```

## Mixed String and Numeric IDs

You can define models that accept both string and numeric IDs:

```typescript
interface LocationData extends ModelAttributes {
  id: string | number; // Can be either
  name: string;
  type: 'city' | 'province';
}

class Location extends Model<LocationData> {
  static collectionName = 'locations';
}

// Works with both types
const loc1 = await Location.find(12345); // Numeric
const loc2 = await Location.find('abc-123'); // String
```

## Preserving Numeric Fields

If you want to maintain a separate numeric ID field in your data (in addition to the Firestore document ID), you can do so:

```typescript
interface CityData extends ModelAttributes {
  id: string; // Firestore document ID (always string)
  cityId: number; // Your numeric ID field (preserved as number)
  name: string;
}

class City extends Model<CityData> {
  static collectionName = 'cities';
}

const city = await City.create({
  cityId: 12345, // This is preserved as a number in the document
  name: 'Jakarta',
});

console.log(typeof city.get('cityId')); // "number"
```

## How It Works

### Important: Firestore Only Accepts String IDs

**Firestore document IDs must always be strings.** Firestore does not accept numbers as document IDs.

FirestORM provides numeric ID support as a **convenience feature** that automatically converts numbers to strings before calling Firestore:

```typescript
static normalizeId(id: string | number): string {
  return typeof id === 'number' ? id.toString() : id;
}
```

**What this means:**

- You can use `City.find(12345)` in your code (convenient)
- FirestORM converts it to `"12345"` internally
- Firestore receives `"12345"` as a string (required)
- The document is stored with ID `"12345"` in Firestore

This conversion happens automatically at the Firestore boundary, so you can work with numeric IDs throughout your application code without worrying about type conversions.

## Type Safety

TypeScript will enforce type safety based on your model definition:

```typescript
interface CityData extends ModelAttributes {
  id: number; // Only numeric IDs allowed
  name: string;
}

class City extends Model<CityData> {
  static collectionName = 'cities';
}

// TypeScript will accept both (runtime conversion handles it)
await City.find(12345); // ✓ Preferred
await City.find('12345'); // ✓ Also works
```

## Best Practices

1. **Be Consistent**: Choose either string or numeric IDs for a collection and stick with it
2. **Document Your Choice**: Make it clear in your model definition which type you're using
3. **Consider Migration**: If migrating from SQL, numeric IDs can ease the transition
4. **Use Type Definitions**: Always define the `id` type in your model interface for clarity
5. **Separate Fields**: If you need both a Firestore ID and a numeric identifier, use separate fields

## Limitations

- **Firestore Requirement**: Document IDs MUST be strings (Firestore limitation, not FirestORM)
- **Automatic Conversion**: Numeric IDs are automatically converted to strings before Firestore operations
- **Storage Format**: All IDs are stored as strings in Firestore (e.g., `12345` becomes `"12345"`)
- **Precision Limits**: Very large numbers may lose precision (JavaScript number limitations apply)
- **No True Numeric IDs**: You cannot have actual numeric IDs in Firestore, only string representations of numbers

## Migration from String IDs

If you're migrating from string IDs to numeric IDs:

```typescript
// Before
interface CityData extends ModelAttributes {
  id: string;
  name: string;
}

// After
interface CityData extends ModelAttributes {
  id: number; // Changed to number
  name: string;
}

// Your existing code continues to work
const city = await City.find(12345);
```

## Examples

See the complete examples in:

- `examples/numeric-ids.ts` - Comprehensive numeric ID examples
- `examples/basic-usage.ts` - Basic CRUD operations

## Related Documentation

- [Defining Models](./02-defining-models.md)
- [CRUD Operations](./04-crud-operations.md)
- [Subcollections](./09-subcollections.md)
- [Realtime & Transactions](./07-realtime-transactions.md)
