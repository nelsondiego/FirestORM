/**
 * Pagination Example
 *
 * This example demonstrates the three pagination strategies available:
 * 1. Standard Pagination - With total count and page numbers (best for traditional pagination)
 * 2. Simple Pagination - Cursor-based without total count (more efficient)
 * 3. Cursor Pagination - Bidirectional with before/after cursors (best for infinite scroll)
 *
 * Choose the right strategy based on your UI needs and performance requirements.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeOrm, Model, type ModelData } from '../src';

// Initialize
const app = initializeApp({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
});
const firestore = getFirestore(app);
initializeOrm(firestore);

// Define model
interface UserData {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

class User extends Model<UserData> {
  static collectionName = 'users';
}

// ============================================
// PAGINATION EXAMPLES
// ============================================

async function paginationExamples() {
  // ============================================
  // 1. Default pagination (10 per page, page 1)
  // ============================================
  const defaultResult = await User.paginate();
  console.log('Default:', defaultResult.data.length); // Up to 10 items
  console.log('Meta:', defaultResult.meta);

  // ============================================
  // 2. Custom perPage only
  // ============================================
  const customPerPage = await User.paginate({ perPage: 25 });
  console.log('Custom perPage:', customPerPage.data.length); // Up to 25 items

  // ============================================
  // 3. Custom page only (uses default perPage: 10)
  // ============================================
  const customPage = await User.paginate({ page: 2 });
  console.log('Page 2:', customPage.data.length); // Page 2 with 10 items

  // ============================================
  // 4. Both perPage and page
  // ============================================
  const fullCustom = await User.paginate({ perPage: 50, page: 3 });
  console.log('Page 3 with 50 per page:', fullCustom.data.length);

  // ============================================
  // 5. With query constraints
  // ============================================
  const filtered = await User.where('status', '==', 'active')
    .orderBy('name', 'asc')
    .paginate({ perPage: 20, page: 1 });

  console.log('Filtered pagination:', {
    total: filtered.meta.total,
    currentPage: filtered.meta.currentPage,
    lastPage: filtered.meta.lastPage,
    hasMorePages: filtered.meta.hasMorePages,
  });

  // ============================================
  // 6. Simple pagination (cursor-based)
  // ============================================

  // First page
  const firstPage = await User.simplePaginate({ perPage: 10 });
  console.log('First page:', firstPage.data.length);

  // Next page using cursor
  if (firstPage.nextCursor) {
    const secondPage = await User.simplePaginate({
      perPage: 10,
      cursor: firstPage.nextCursor,
    });
    console.log('Second page:', secondPage.data.length);
  }

  // Default (10 per page, no cursor)
  const defaultSimple = await User.simplePaginate();

  // ============================================
  // 7. Cursor pagination (for infinite scroll)
  // ============================================

  // First load
  const initial = await User.cursorPaginate({ perPage: 20 });
  console.log('Initial load:', initial.data.length);

  // Load more
  if (initial.nextCursor) {
    const more = await User.cursorPaginate({
      perPage: 20,
      afterCursor: initial.nextCursor,
    });
    console.log('Load more:', more.data.length);
    console.log('Has next page:', more.hasNextPage);
  }

  // Default (10 per page)
  const defaultCursor = await User.cursorPaginate();

  // ============================================
  // 8. Building a paginated API endpoint
  // ============================================
  async function getPaginatedUsers(
    page?: number,
    perPage?: number
  ): Promise<{
    users: UserData[];
    pagination: {
      total: number;
      perPage: number;
      currentPage: number;
      lastPage: number;
      hasMorePages: boolean;
    };
  }> {
    const result = await User.where('status', '==', 'active').paginate({
      perPage: perPage ?? 10, // Default 10
      page: page ?? 1, // Default 1
    });

    return {
      users: result.data,
      pagination: result.meta,
    };
  }

  // Usage
  const apiResult = await getPaginatedUsers(1, 25);
  console.log('API result:', apiResult.pagination);

  // ============================================
  // 9. Infinite scroll implementation
  // ============================================
  class InfiniteScroll {
    private cursor: string | null = null;
    private hasMore = true;
    private items: UserData[] = [];

    async loadMore(perPage: number = 20): Promise<UserData[]> {
      if (!this.hasMore) {
        return [];
      }

      const result = await User.where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .cursorPaginate({
          perPage,
          afterCursor: this.cursor ?? undefined,
        });

      this.items.push(...result.data);
      this.cursor = result.nextCursor;
      this.hasMore = result.hasNextPage;

      return result.data;
    }

    getAll(): UserData[] {
      return this.items;
    }

    reset(): void {
      this.cursor = null;
      this.hasMore = true;
      this.items = [];
    }
  }

  const scroll = new InfiniteScroll();
  await scroll.loadMore(10); // Load first 10
  await scroll.loadMore(10); // Load next 10
  console.log('Total loaded:', scroll.getAll().length);
}

paginationExamples().catch(console.error);
