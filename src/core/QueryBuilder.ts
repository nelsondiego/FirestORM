import {
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  getDocs,
  getDoc,
  getCountFromServer,
  doc,
  QueryConstraint,
  DocumentSnapshot,
} from 'firebase/firestore';
import { Collection } from './Collection';
import { Model, ModelData, ModelConstructor } from './Model';
import { WhereOperator } from '../types';
import { ModelNotFoundError } from '../errors/ModelNotFoundError';

// ============================================
// PAGINATION TYPES
// ============================================

export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  from: number;
  to: number;
  hasMorePages: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
  firstDoc: DocumentSnapshot | null;
  lastDoc: DocumentSnapshot | null;
}

// ============================================
// QUERY BUILDER CLASS
// ============================================

export class QueryBuilder<M extends Model> {
  private constraints: QueryConstraint[] = [];
  private modelConstructor: ModelConstructor<M>;

  constructor(modelConstructor: ModelConstructor<M>) {
    this.modelConstructor = modelConstructor;
  }

  /**
   * Add where constraint
   */
  where(field: string, operator: WhereOperator, value: any): this {
    this.constraints.push(where(field, operator, value));
    return this;
  }

  /**
   * Add whereIn constraint
   */
  whereIn(field: string, values: any[]): this {
    return this.where(field, 'in', values);
  }

  /**
   * Add whereNotIn constraint
   */
  whereNotIn(field: string, values: any[]): this {
    return this.where(field, 'not-in', values);
  }

  /**
   * Add orderBy constraint
   */
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.constraints.push(orderBy(field, direction));
    return this;
  }

  /**
   * Add limit constraint
   */
  limit(count: number): this {
    this.constraints.push(limit(count));
    return this;
  }

  /**
   * Pagination: start after document
   */
  startAfter(snapshot: DocumentSnapshot): this {
    this.constraints.push(startAfter(snapshot));
    return this;
  }

  /**
   * Pagination: end before document
   */
  endBefore(snapshot: DocumentSnapshot): this {
    this.constraints.push(endBefore(snapshot));
    return this;
  }

  /**
   * Get first result as plain JSON (default) - Typed
   */
  async first(): Promise<ModelData<M> | null> {
    this.limit(1);
    const results = await this.get();
    return results[0] || null;
  }

  /**
   * Get first result as Model instance
   */
  async firstModel(): Promise<M | null> {
    this.limit(1);
    const results = await this.getModels();
    return results.first() || null;
  }

  /**
   * Get first result or throw - Typed
   */
  async firstOrFail(): Promise<ModelData<M>> {
    const result = await this.first();
    if (!result) {
      throw new ModelNotFoundError('No results found');
    }
    return result;
  }

  /**
   * Execute query and get results as plain JSON objects (default) - Typed
   */
  async get(): Promise<ModelData<M>[]> {
    const collectionRef = this.modelConstructor.getCollectionRef();
    const q = query(collectionRef, ...this.constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ModelData<M>[];
  }

  /**
   * Execute query and get results as Model instances
   */
  async getModels(): Promise<Collection<M>> {
    const collectionRef = this.modelConstructor.getCollectionRef();
    const q = query(collectionRef, ...this.constraints);
    const snapshot = await getDocs(q);

    const models = snapshot.docs.map((doc) => {
      const instance = new this.modelConstructor({
        id: doc.id,
        ...doc.data(),
      } as any);
      (instance as any).exists = true;
      (instance as any).original = { id: doc.id, ...doc.data() };
      return instance;
    });

    return new Collection<M>(models);
  }

  /**
   * Get count of results
   */
  async count(): Promise<number> {
    const results = await this.get();
    return results.length;
  }

  /**
   * Check if any results exist
   */
  async exists(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }

  /**
   * Find by ID and return as plain JSON (default) - Typed
   */
  async find(id: string): Promise<ModelData<M> | null> {
    const collectionRef = this.modelConstructor.getCollectionRef();
    const docRef = doc(collectionRef, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as ModelData<M>;
  }

  /**
   * Find by ID and return as Model instance
   */
  async findModel(id: string): Promise<M | null> {
    const collectionRef = this.modelConstructor.getCollectionRef();
    const docRef = doc(collectionRef, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const instance = new this.modelConstructor({
      id: docSnap.id,
      ...docSnap.data(),
    } as any);
    (instance as any).exists = true;
    (instance as any).original = { id: docSnap.id, ...docSnap.data() };

    return instance;
  }

  /**
   * Paginate results (Eloquent-style) - Returns typed JSON
   */
  async paginate(options?: {
    perPage?: number;
    page?: number;
  }): Promise<PaginatedResult<ModelData<M>>> {
    const perPage = options?.perPage ?? 10;
    const page = options?.page ?? 1;
    const collectionRef = this.modelConstructor.getCollectionRef();

    // Get total count
    const countQuery = query(collectionRef, ...this.constraints);
    const countSnapshot = await getCountFromServer(countQuery);
    const total = countSnapshot.data().count;

    // Calculate pagination
    const lastPage = Math.ceil(total / perPage);
    const from = (page - 1) * perPage + 1;

    // Get paginated data
    const offset = (page - 1) * perPage;
    const paginatedConstraints = [...this.constraints, limit(perPage)];

    // If not first page, skip documents
    if (offset > 0) {
      const prevPageQuery = query(
        collectionRef,
        ...this.constraints,
        limit(offset)
      );
      const prevSnapshot = await getDocs(prevPageQuery);
      const lastDoc = prevSnapshot.docs[prevSnapshot.docs.length - 1];

      if (lastDoc) {
        paginatedConstraints.push(startAfter(lastDoc));
      }
    }

    const q = query(collectionRef, ...paginatedConstraints);
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ModelData<M>[];

    const firstDoc = snapshot.docs[0] || null;
    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

    return {
      data,
      meta: {
        total,
        perPage,
        currentPage: page,
        lastPage,
        from: data.length > 0 ? from : 0,
        to: data.length > 0 ? from + data.length - 1 : 0,
        hasMorePages: page < lastPage,
      },
      firstDoc,
      lastDoc,
    };
  }

  /**
   * Simple pagination with cursor (more efficient for large datasets)
   */
  async simplePaginate(options?: {
    perPage?: number;
    cursor?: DocumentSnapshot;
  }): Promise<{
    data: ModelData<M>[];
    nextCursor: DocumentSnapshot | null;
    hasMorePages: boolean;
  }> {
    const perPage = options?.perPage ?? 10;
    const cursor = options?.cursor;

    const collectionRef = this.modelConstructor.getCollectionRef();
    const paginatedConstraints = [...this.constraints, limit(perPage + 1)];

    if (cursor) {
      paginatedConstraints.push(startAfter(cursor));
    }

    const q = query(collectionRef, ...paginatedConstraints);
    const snapshot = await getDocs(q);

    const hasMorePages = snapshot.docs.length > perPage;
    const docs = hasMorePages ? snapshot.docs.slice(0, perPage) : snapshot.docs;

    const data = docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ModelData<M>[];

    const nextCursor = hasMorePages ? docs[docs.length - 1] : null;

    return {
      data,
      nextCursor,
      hasMorePages,
    };
  }

  /**
   * Cursor-based pagination (for infinite scroll)
   */
  async cursorPaginate(options?: {
    perPage?: number;
    afterCursor?: string;
    beforeCursor?: string;
  }): Promise<{
    data: ModelData<M>[];
    nextCursor: string | null;
    prevCursor: string | null;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    const perPage = options?.perPage ?? 10;
    const afterCursor = options?.afterCursor;
    const beforeCursor = options?.beforeCursor;

    const collectionRef = this.modelConstructor.getCollectionRef();
    const paginatedConstraints = [...this.constraints];

    // Handle cursor navigation
    if (afterCursor) {
      const cursorDoc = await getDoc(doc(collectionRef, afterCursor));
      if (cursorDoc.exists()) {
        paginatedConstraints.push(startAfter(cursorDoc));
      }
    } else if (beforeCursor) {
      const cursorDoc = await getDoc(doc(collectionRef, beforeCursor));
      if (cursorDoc.exists()) {
        paginatedConstraints.push(endBefore(cursorDoc));
      }
    }

    paginatedConstraints.push(limit(perPage + 1));

    const q = query(collectionRef, ...paginatedConstraints);
    const snapshot = await getDocs(q);

    const hasMore = snapshot.docs.length > perPage;
    const docs = hasMore ? snapshot.docs.slice(0, perPage) : snapshot.docs;

    const data = docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ModelData<M>[];

    return {
      data,
      nextCursor: hasMore ? docs[docs.length - 1].id : null,
      prevCursor: docs.length > 0 ? docs[0].id : null,
      hasNextPage: hasMore,
      hasPrevPage: !!afterCursor || !!beforeCursor,
    };
  }

  /**
   * Clone query builder
   */
  clone(): QueryBuilder<M> {
    const cloned = new QueryBuilder(this.modelConstructor);
    cloned.constraints = [...this.constraints];
    return cloned;
  }
}
