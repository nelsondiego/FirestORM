# Pagination

NDFirestORM provides three types of pagination to suit different use cases.

## 📊 Standard Pagination

Standard pagination with full metadata (total count, pages, etc.)

### Basic Usage

```typescript
const result = await User.paginate({
  perPage: 20,
  page: 1,
});

console.log(result.data); // Array of users
console.log(result.meta); // Pagination metadata
```

### Pagination Metadata

```typescript
interface PaginationMeta {
  total: number; // Total number of records
  perPage: number; // Records per page
  currentPage: number; // Current page number
  lastPage: number; // Last page number
  from: number; // First record number on page
  to: number; // Last record number on page
  hasMorePages: boolean; // Whether there are more pages
}
```

### Complete Example

```typescript
const result = await User.where('status', '==', 'active')
  .orderBy('createdAt', 'desc')
  .paginate({ perPage: 20, page: 1 });

console.log(result.data); // UserData[]
console.log(result.meta);
// {
//   total: 150,
//   perPage: 20,
//   currentPage: 1,
//   lastPage: 8,
//   from: 1,
//   to: 20,
//   hasMorePages: true
// }
```

### Default Values

```typescript
// Default: 10 per page, page 1
const result = await User.paginate();

// Custom perPage only
const result = await User.paginate({ perPage: 50 });

// Custom page only (uses default perPage: 10)
const result = await User.paginate({ page: 2 });
```

## ⚡ Simple Pagination

Cursor-based pagination without total count (more efficient for large datasets)

### Basic Usage

```typescript
const result = await User.simplePaginate({
  perPage: 20,
});

console.log(result.data); // Array of users
console.log(result.nextCursor); // DocumentSnapshot for next page
console.log(result.hasMorePages); // boolean
```

### Load Next Page

```typescript
// First page
const page1 = await User.simplePaginate({ perPage: 20 });

// Next page using cursor
if (page1.hasMorePages && page1.nextCursor) {
  const page2 = await User.simplePaginate({
    perPage: 20,
    cursor: page1.nextCursor,
  });
}
```

### Complete Example

```typescript
async function loadAllUsers() {
  const allUsers: UserData[] = [];
  let cursor: DocumentSnapshot | null = null;
  let hasMore = true;

  while (hasMore) {
    const result = await User.simplePaginate({
      perPage: 50,
      cursor: cursor || undefined,
    });

    allUsers.push(...result.data);
    cursor = result.nextCursor;
    hasMore = result.hasMorePages;

    console.log(`Loaded ${result.data.length} users`);
  }

  console.log(`Total loaded: ${allUsers.length}`);
  return allUsers;
}
```

## 🔄 Cursor Pagination

Bidirectional cursor-based pagination (perfect for infinite scroll)

### Basic Usage

```typescript
const result = await User.cursorPaginate({
  perPage: 20,
});

console.log(result.data); // Array of users
console.log(result.nextCursor); // ID of next page
console.log(result.prevCursor); // ID of previous page
console.log(result.hasNextPage); // boolean
console.log(result.hasPrevPage); // boolean
```

### Navigate Forward

```typescript
// First page
const page1 = await User.cursorPaginate({ perPage: 20 });

// Next page
if (page1.hasNextPage) {
  const page2 = await User.cursorPaginate({
    perPage: 20,
    afterCursor: page1.nextCursor!,
  });
}
```

### Navigate Backward

```typescript
// Go back to previous page
if (page2.hasPrevPage) {
  const page1Again = await User.cursorPaginate({
    perPage: 20,
    beforeCursor: page2.prevCursor!,
  });
}
```

## 🎯 Use Cases

### API Endpoint with Standard Pagination

```typescript
// Express.js
app.get('/api/users', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 20;

  const result = await User.where('status', '==', 'active').paginate({
    perPage,
    page,
  });

  res.json({
    users: result.data,
    pagination: result.meta,
  });
});

// Response:
// {
//   users: [...],
//   pagination: {
//     total: 150,
//     perPage: 20,
//     currentPage: 1,
//     lastPage: 8,
//     hasMorePages: true
//   }
// }
```

### React Hook with Standard Pagination

```typescript
import { useState, useEffect } from 'react';
import { User, type UserData } from '@/models';
import type { PaginationMeta } from 'ndfirestorm';

function usePaginatedUsers(perPage: number = 20) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadPage = async (page: number) => {
    setLoading(true);
    try {
      const result = await User.where('status', '==', 'active').paginate({
        perPage,
        page,
      });

      setUsers(result.data);
      setMeta(result.meta);
      setCurrentPage(page);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(1);
  }, []);

  return {
    users,
    meta,
    loading,
    currentPage,
    goToPage: loadPage,
    nextPage: () => meta && loadPage(currentPage + 1),
    prevPage: () => currentPage > 1 && loadPage(currentPage - 1),
  };
}

// Usage in component
function UserList() {
  const { users, meta, loading, nextPage, prevPage } = usePaginatedUsers(20);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>

      <div>
        <button onClick={prevPage} disabled={meta?.currentPage === 1}>
          Previous
        </button>
        <span>
          Page {meta?.currentPage} of {meta?.lastPage}
        </span>
        <button onClick={nextPage} disabled={!meta?.hasMorePages}>
          Next
        </button>
      </div>
    </div>
  );
}
```

### Infinite Scroll with Cursor Pagination

```typescript
import { useState, useEffect } from 'react';
import { User, type UserData } from '@/models';

function useInfiniteScroll() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const result = await User.where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .cursorPaginate({
          perPage: 20,
          afterCursor: cursor || undefined,
        });

      setUsers((prev) => [...prev, ...result.data]);
      setCursor(result.nextCursor);
      setHasMore(result.hasNextPage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMore();
  }, []);

  return { users, loadMore, hasMore, loading };
}

// Usage in component
function InfiniteUserList() {
  const { users, loadMore, hasMore, loading } = useInfiniteScroll();

  return (
    <div>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>

      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### Batch Processing with Simple Pagination

```typescript
async function processAllUsers(callback: (user: UserData) => Promise<void>) {
  let cursor: DocumentSnapshot | null = null;
  let hasMore = true;
  let processed = 0;

  while (hasMore) {
    const result = await User.simplePaginate({
      perPage: 100,
      cursor: cursor || undefined,
    });

    // Process each user
    for (const user of result.data) {
      await callback(user);
      processed++;
    }

    cursor = result.nextCursor;
    hasMore = result.hasMorePages;

    console.log(`Processed ${processed} users so far...`);
  }

  console.log(`Total processed: ${processed} users`);
}

// Usage
await processAllUsers(async (user) => {
  // Send email, update data, etc.
  console.log(`Processing user: ${user.name}`);
});
```

## 📊 Comparison

| Feature        | Standard      | Simple           | Cursor          |
| -------------- | ------------- | ---------------- | --------------- |
| Total count    | ✅ Yes        | ❌ No            | ❌ No           |
| Performance    | ⚠️ Slower     | ✅ Fast          | ✅ Fast         |
| Metadata       | ✅ Full       | ⚠️ Limited       | ⚠️ Limited      |
| Bidirectional  | ✅ Yes        | ❌ No            | ✅ Yes          |
| Use case       | UI pagination | Batch processing | Infinite scroll |
| Large datasets | ⚠️ Not ideal  | ✅ Excellent     | ✅ Excellent    |

## 💡 Best Practices

1. **Use standard pagination for UI** - When you need page numbers
2. **Use simple pagination for batch processing** - More efficient
3. **Use cursor pagination for infinite scroll** - Best UX
4. **Always set a reasonable perPage** - Don't load too many at once
5. **Order your results** - Consistent ordering is important for pagination
6. **Cache results** - Consider caching paginated results

## ⚠️ Important Notes

### Standard Pagination Performance

Standard pagination uses `getCountFromServer()` which counts all matching documents. This can be slow for large collections.

```typescript
// ⚠️ Slow for large collections
const result = await User.paginate({ perPage: 20, page: 1 });

// ✅ Better for large collections
const result = await User.simplePaginate({ perPage: 20 });
```

### Cursor Stability

Cursors are based on document IDs. If documents are deleted, cursors remain valid.

```typescript
// Cursor remains valid even if documents are deleted
const page1 = await User.cursorPaginate({ perPage: 20 });
// ... some documents deleted ...
const page2 = await User.cursorPaginate({
  perPage: 20,
  afterCursor: page1.nextCursor!,
}); // Still works
```

## 🔗 Next

- [Type Utilities](./06-type-utilities.md) - Use type helpers
- [Best Practices](./07-best-practices.md) - Tips and tricks
