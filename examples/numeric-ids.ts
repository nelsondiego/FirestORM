import { Model, ModelAttributes } from '../src';

// ============================================
// EXAMPLE: Numeric ID Support
// ============================================

// IMPORTANT: Firestore document IDs MUST be strings.
// This feature allows you to use numbers in your code for convenience,
// but they are automatically converted to strings before Firestore operations.
// Example: City.find(12345) → Firestore receives "12345" as a string

// Define a City model with numeric ID
interface CityData extends ModelAttributes {
  id: number; // Numeric ID
  name: string;
  province: string;
  population?: number;
}

class City extends Model<CityData> {
  static collectionName = 'locations_cities';
}

// Define a Province model with numeric ID
interface ProvinceData extends ModelAttributes {
  id: number; // Numeric ID
  name: string;
  country: string;
}

class Province extends Model<ProvinceData> {
  static collectionName = 'locations_provinces';
}

async function demonstrateNumericIds() {
  console.log('=== Numeric ID Support Examples ===\n');

  // ============================================
  // 1. FIND BY NUMERIC ID
  // ============================================
  console.log('1. Find by numeric ID:');
  const city1 = await City.find(12345);
  console.log('City found:', city1);

  // Also works with string
  const city2 = await City.find('12345');
  console.log('Same city (string ID):', city2);

  // ============================================
  // 2. LOAD BY NUMERIC ID
  // ============================================
  console.log('\n2. Load by numeric ID:');
  const cityInstance = await City.load(12345);
  if (cityInstance) {
    console.log('City loaded:', cityInstance.toJSON());
  }

  // ============================================
  // 3. CREATE WITH NUMERIC ID
  // ============================================
  console.log('\n3. Create with numeric ID:');
  const newCity = await City.create(
    {
      name: 'Jakarta',
      province: 'DKI Jakarta',
      population: 10000000,
    },
    54321 // Numeric custom ID
  );
  console.log('City created with numeric ID:', newCity.toJSON());

  // ============================================
  // 4. UPDATE BY NUMERIC ID
  // ============================================
  console.log('\n4. Update by numeric ID:');
  await City.update(12345, {
    population: 11000000,
  });
  console.log('City updated');

  // ============================================
  // 5. DELETE BY NUMERIC ID
  // ============================================
  console.log('\n5. Delete by numeric ID:');
  await City.destroy(54321);
  console.log('City deleted');

  // ============================================
  // 6. QUERY WITH NUMERIC ID IN WHERE CLAUSE
  // ============================================
  console.log('\n6. Query with numeric ID:');
  const cities = await City.where('id', '==', 12345).get();
  console.log('Cities found:', cities);

  // ============================================
  // 7. LISTEN TO NUMERIC ID
  // ============================================
  console.log('\n7. Listen to numeric ID:');
  const unsubscribe = City.listen(12345, (data) => {
    console.log('City updated in real-time:', data);
  });

  // Stop listening after 5 seconds
  setTimeout(() => {
    unsubscribe();
    console.log('Stopped listening');
  }, 5000);

  // ============================================
  // 8. BATCH OPERATIONS WITH NUMERIC IDS
  // ============================================
  console.log('\n8. Batch operations with numeric IDs:');
  await City.batch(async (ctx) => {
    // Create with numeric ID
    ctx.create(City, { name: 'Bandung', province: 'West Java' }, 11111);
    ctx.create(City, { name: 'Surabaya', province: 'East Java' }, 22222);

    // Update by numeric ID
    ctx.update(City, 12345, { population: 12000000 });

    // Delete by numeric ID
    ctx.delete(City, 11111);
  });
  console.log('Batch operations completed');

  // ============================================
  // 9. TRANSACTION WITH NUMERIC IDS
  // ============================================
  console.log('\n9. Transaction with numeric IDs:');
  await City.transaction(async (ctx) => {
    const city = await City.load(12345);
    if (city) {
      await ctx.update(city, { population: city.get('population')! + 1000 });
    }

    // Create new city in transaction
    await ctx.create(City, { name: 'Medan', province: 'North Sumatra' }, 33333);

    // Delete by numeric ID
    await ctx.delete(City, 22222);
  });
  console.log('Transaction completed');

  // ============================================
  // 10. SUBCOLLECTIONS WITH NUMERIC PARENT ID
  // ============================================
  console.log('\n10. Subcollections with numeric parent ID:');

  // Access subcollection using numeric parent ID
  const districts = await City.subcollection(12345, 'districts').get();
  console.log('Districts:', districts);

  // Create in subcollection with numeric parent ID
  const newDistrict = await City.subcollection(12345, 'districts').create({
    name: 'Central District',
    area: 50.5,
  });
  console.log('District created:', newDistrict);

  // ============================================
  // 11. MIXED STRING AND NUMERIC IDS
  // ============================================
  console.log('\n11. Mixed string and numeric IDs:');

  // Model can have both string and numeric IDs
  interface LocationData extends ModelAttributes {
    id: string | number; // Can be either
    name: string;
    type: 'city' | 'province';
  }

  class Location extends Model<LocationData> {
    static collectionName = 'locations';
  }

  // Works with both
  const loc1 = await Location.find(12345); // Numeric
  const loc2 = await Location.find('abc-123'); // String
  console.log('Location 1:', loc1);
  console.log('Location 2:', loc2);

  // ============================================
  // 12. PRESERVING NUMERIC FIELDS IN DATA
  // ============================================
  console.log('\n12. Preserving numeric fields:');

  // When you have a separate numeric ID field, it's preserved
  interface CityWithNumericField extends ModelAttributes {
    id: string; // Firestore document ID (always string)
    cityId: number; // Your numeric ID field
    name: string;
  }

  class CityWithField extends Model<CityWithNumericField> {
    static collectionName = 'cities_with_field';
  }

  const cityWithField = await CityWithField.create({
    cityId: 12345, // This is preserved as number
    name: 'Jakarta',
  });
  console.log('City with numeric field:', cityWithField.toJSON());
  console.log('cityId type:', typeof cityWithField.get('cityId')); // number

  console.log('\n=== All examples completed ===');
}

// Run the examples
// demonstrateNumericIds().catch(console.error);

export { City, Province, demonstrateNumericIds };
