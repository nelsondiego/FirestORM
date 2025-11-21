# Queries

## 🔍 Basic Queries

### Get All Records

```typescript
// Get all users as JSON
const users: UserData[] = await User.all();
```

### Find by ID

```typescript
// Find and return JSON
const user: UserData | null = await User.find('user123');

// Load model instance for updates
const userModel = await User.load('user123');

// Find or throw error
const user = await User.findOrFail('user123');
```

### Get First Record

```typescript
// Get first user
const user = await User.first();

// Get first or throw
const user = await User.firstOrFail();
```

## 🎯 Where Clauses

### Basic Where

```typescript
// Equal to
const activeUsers = await User.where('status', '==', 'active').get();

// Not equal to
const nonAdmins = await User.where('role', '!=', 'admin').get();

// Greater than
const adults = await User.where('age', '>', 18).get();

// Less than
const young = await User.where('age', '<', 30).get();

// Greater than or equal
const eligible = await User.where('age', '>=', 21).get();

// Less than or equal
const students = await User.where('age', '<=', 25).get();
```

### Multiple Where Clauses

```typescript
// Chain multiple conditions
const result = await User.where('status', '==', 'active')
  .where('age', '>=', 18)
  .where('emailVerified', '==', true)
  .get();
```

### Where In

```typescript
// Find users with specific IDs
const users = await User.whereIn('id', ['user1', 'user2', 'user3']).get();

// Find users with specific roles
const staff = await User.whereIn('role', ['admin', 'moderator']).get();
```

### Where Not In

```typescript
// Exclude specific users
const users = await User.whereNotIn('id', ['banned1', 'banned2']).get();

// Exclude specific statuses
const users = await User.whereNotIn('status', ['banned', 'deleted']).get();
```

### Array Contains

```typescript
// Find users with a specific tag
const users = await User.where('tags', 'array-contains', 'premium').get();

// Find gyms with a specific amenity
const gyms = await Gym.where('amenities', 'array-contains', 'pool').get();
```

## 📊 Ordering

### Order By

```typescript
// Order ascending (default)
const users = await User.orderBy('name').get();

// Order descending
const users = await User.orderBy('createdAt', 'desc').get();

// Multiple order by
const users = await User.orderBy('status', 'asc')
  .orderBy('createdAt', 'desc')
  .get();
```

## 🔢 Limiting Results

### Limit

```typescript
// Get first 10 users
const users = await User.limit(10).get();

// Get top 5 products by price
const products = await Product.orderBy('price', 'desc').limit(5).get();
```

## 🔗 Combining Queries

### Complex Queries

```typescript
// Active, verified users, ordered by name, limited to 20
const users = await User.where('status', '==', 'active')
  .where('emailVerified', '==', true)
  .orderBy('name', 'asc')
  .limit(20)
  .get();

// Recent published posts by author
const posts = await Post.where('authorId', '==', 'author123')
  .where('published', '==', true)
  .orderBy('publishedAt', 'desc')
  .limit(10)
  .get();
```

## 📈 Aggregations

### Count

```typescript
// Count all users
const total = await User.query().count();

// Count active users
const activeCount = await User.where('status', '==', 'active').count();
```

### Exists

```typescript
// Check if any admin exists
const hasAdmins = await User.where('role', '==', 'admin').exists();

// Check if user with email exists
const emailExists = await User.where(
  'email',
  '==',
  'test@example.com'
).exists();
```

## 🎨 Query Scopes

### Defining Scopes

```typescript
export class User extends Model<UserData> {
  static collectionName = 'users';

  // Scope for active users
  static active() {
    return this.where('status', '==', 'active');
  }

  // Scope for verified users
  static verified() {
    return this.where('emailVerified', '==', true);
  }

  // Scope for admins
  static admins() {
    return this.where('role', '==', 'admin');
  }

  // Scope for recent users (last 30 days)
  static recent() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.where('createdAt', '>=', thirtyDaysAgo);
  }
}
```

### Using Scopes

```typescript
// Use single scope
const activeUsers = await User.active().get();

// Chain scopes
const activeVerifiedUsers = await User.active().verified().get();

// Combine scopes with other queries
const recentAdmins = await User.admins()
  .recent()
  .orderBy('createdAt', 'desc')
  .get();
```

## 🔍 Advanced Queries

### Query Builder Pattern

```typescript
// Build query dynamically
let query = User.query();

if (status) {
  query = query.where('status', '==', status);
}

if (minAge) {
  query = query.where('age', '>=', minAge);
}

if (sortBy) {
  query = query.orderBy(sortBy, sortDirection);
}

const users = await query.limit(20).get();
```

### Conditional Queries

```typescript
async function searchUsers(filters: {
  status?: string;
  role?: string;
  minAge?: number;
  verified?: boolean;
}) {
  let query = User.query();

  if (filters.status) {
    query = query.where('status', '==', filters.status);
  }

  if (filters.role) {
    query = query.where('role', '==', filters.role);
  }

  if (filters.minAge) {
    query = query.where('age', '>=', filters.minAge);
  }

  if (filters.verified !== undefined) {
    query = query.where('emailVerified', '==', filters.verified);
  }

  return query.orderBy('createdAt', 'desc').get();
}

// Usage
const users = await searchUsers({
  status: 'active',
  minAge: 18,
  verified: true,
});
```

## 📝 Query Examples

### E-commerce Queries

```typescript
// Find products in stock, sorted by price
const products = await Product.where('stock', '>', 0)
  .orderBy('price', 'asc')
  .get();

// Find on-sale products
const saleProducts = await Product.where('compareAtPrice', '>', 0)
  .where('published', '==', true)
  .orderBy('discount', 'desc')
  .limit(20)
  .get();

// Find products by category
const electronics = await Product.where('category', '==', 'electronics')
  .where('status', '==', 'active')
  .orderBy('rating', 'desc')
  .get();
```

### Blog Queries

```typescript
// Find published posts by author
const posts = await Post.where('authorId', '==', authorId)
  .where('published', '==', true)
  .orderBy('publishedAt', 'desc')
  .limit(10)
  .get();

// Find posts with specific tag
const taggedPosts = await Post.where('tags', 'array-contains', 'javascript')
  .where('published', '==', true)
  .orderBy('likes', 'desc')
  .get();

// Find recent posts
const recentPosts = await Post.where('published', '==', true)
  .orderBy('publishedAt', 'desc')
  .limit(5)
  .get();
```

### User Management Queries

```typescript
// Find active admins
const admins = await User.where('role', '==', 'admin')
  .where('status', '==', 'active')
  .orderBy('name')
  .get();

// Find users who haven't logged in recently
const inactiveDate = new Date();
inactiveDate.setDate(inactiveDate.getDate() - 90);

const inactiveUsers = await User.where('lastLoginAt', '<', inactiveDate)
  .where('status', '==', 'active')
  .get();

// Find new users this month
const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

const newUsers = await User.where('createdAt', '>=', startOfMonth)
  .orderBy('createdAt', 'desc')
  .get();
```

## 🎯 Query Operators Reference

| Operator             | Description              | Example                                   |
| -------------------- | ------------------------ | ----------------------------------------- |
| `==`                 | Equal to                 | `.where('status', '==', 'active')`        |
| `!=`                 | Not equal to             | `.where('role', '!=', 'guest')`           |
| `>`                  | Greater than             | `.where('age', '>', 18)`                  |
| `<`                  | Less than                | `.where('price', '<', 100)`               |
| `>=`                 | Greater than or equal    | `.where('score', '>=', 80)`               |
| `<=`                 | Less than or equal       | `.where('stock', '<=', 10)`               |
| `in`                 | In array                 | `.whereIn('id', ['id1', 'id2'])`          |
| `not-in`             | Not in array             | `.whereNotIn('status', ['banned'])`       |
| `array-contains`     | Array contains value     | `.where('tags', 'array-contains', 'new')` |
| `array-contains-any` | Array contains any value | Not yet implemented                       |

## 💡 Best Practices

1. **Use scopes for common queries** - Makes code more readable
2. **Index your queries** - Add indexes in Firebase Console for complex queries
3. **Limit results** - Always use `.limit()` for large datasets
4. **Order before limit** - Order results before limiting
5. **Use whereIn sparingly** - Limited to 10 items in Firestore
6. **Avoid inequality on multiple fields** - Firestore limitation

## ⚠️ Firestore Limitations

1. **One inequality per query** - Can't use `>` on multiple fields
2. **Array queries** - Only one `array-contains` per query
3. **OR queries** - Not directly supported (use multiple queries)
4. **Composite indexes** - Required for complex queries

## 🔗 Next

- [CRUD Operations](./04-crud-operations.md) - Create, update, delete
- [Pagination](./05-pagination.md) - Paginate results
