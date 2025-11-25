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
  onSnapshot,
  writeBatch,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  QueryConstraint,
  DocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { Model, ModelData, ModelConstructor } from './Model';
import { ModelFactory } from './ModelFactory';
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
  private customCollectionRef?: any;

  constructor(
    modelConstructor: ModelConstructor<M>,
    customCollectionRef?: any
  ) {
    this.modelConstructor = modelConstructor;
    this.customCollectionRef = customCollectionRef;
  }

  /**
   * Get the collection reference (either custom or from model)
   */
  private getCollectionRef(): any {
    return this.customCollectionRef || this.modelConstructor.getCollectionRef();
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
   * Get first result as plain JSON
   */
  async first(): Promise<ModelData<M> | null> {
    this.limit(1);
    const results = await this.get();
    return results[0] || null;
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
   * Execute query and get results as plain JSON
   */
  async get(): Promise<ModelData<M>[]> {
    const collectionRef = this.getCollectionRef();
    const q = query(collectionRef, ...this.constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    })) as ModelData<M>[];
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
   * Find by ID and return as plain JSON
   */
  async find(id: string): Promise<ModelData<M> | null> {
    const collectionRef = this.getCollectionRef();
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
   * Paginate results (Eloquent-style) - Returns typed JSON
   */
  async paginate(options?: {
    perPage?: number;
    page?: number;
  }): Promise<PaginatedResult<ModelData<M>>> {
    const perPage = options?.perPage ?? 10;
    const page = options?.page ?? 1;
    const collectionRef = this.getCollectionRef();

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
      ...(doc.data() as any),
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
      firstDoc: firstDoc as any,
      lastDoc: lastDoc as any,
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

    const collectionRef = this.getCollectionRef();
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
      ...(doc.data() as any),
    })) as ModelData<M>[];

    const nextCursor = hasMorePages ? docs[docs.length - 1] : null;

    return {
      data,
      nextCursor: nextCursor as any,
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

    const collectionRef = this.getCollectionRef();
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
      ...(doc.data() as any),
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
   * Listen to real-time updates for a query (returns JSON array)
   * @param callback - Callback function that receives the query results as JSON array
   * @returns Unsubscribe function
   * @example
   * const unsubscribe = User.where('role', '==', 'admin').listen((users) => {
   *   console.log('Admins updated:', users);
   * });
   *
   * // Stop listening
   * unsubscribe();
   */
  listen(callback: (data: ModelData<M>[]) => void): Unsubscribe {
    const collectionRef = this.getCollectionRef();
    const q = query(collectionRef, ...this.constraints);

    return onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        })) as ModelData<M>[];

        callback(data);
      },
      (error) => {
        console.error('Error listening to query:', error);
        callback([]);
      }
    );
  }

  /**
   * Create a new document in the collection/subcollection
   * @param data - Data for the new document
   * @param customId - Optional custom ID for the document
   * @returns Promise with the created document data
   * @example
   * // Create equipment in subcollection
   * const gym = await Gym.load('gym123');
   * const equipment = await gym.subcollection('equipments').create({
   *   name: 'Treadmill',
   *   quantity: 5,
   *   status: 'active'
   * });
   *
   * // Create with custom ID
   * const feature = await gym.subcollection('features').create({
   *   icon: 'wifi',
   *   title: 'WiFi Gratis'
   * }, 'wifi');
   */
  async create(data: Partial<any>, customId?: string): Promise<ModelData<M>> {
    const collectionRef = this.getCollectionRef();

    // Prepare data with timestamps
    const dataToSave: any = { ...data };
    delete dataToSave.id;
    dataToSave.createdAt = dataToSave.createdAt || new Date();
    dataToSave.updatedAt = new Date();

    let docId: string;

    if (customId) {
      // Use custom ID
      const docRef = doc(collectionRef, customId);
      await setDoc(docRef, dataToSave);
      docId = customId;
    } else {
      // Auto-generate ID
      const docRef = await addDoc(collectionRef, dataToSave);
      docId = docRef.id;
    }

    // Return the created document
    return {
      id: docId,
      ...dataToSave,
    } as ModelData<M>;
  }

  /**
   * Update a document in the collection/subcollection by ID
   * @param id - Document ID to update
   * @param data - Partial data to update
   * @example
   * // Update equipment in subcollection
   * const gym = await Gym.load('gym123');
   * await gym.subcollection('equipments').update('equipment123', {
   *   quantity: 10,
   *   status: 'maintenance'
   * });
   */
  async update(id: string, data: Partial<any>): Promise<void> {
    const collectionRef = this.getCollectionRef();
    const docRef = doc(collectionRef, id);

    // Prepare update data with timestamp
    const updateData: any = { ...data };
    delete updateData.id;
    updateData.updatedAt = new Date();

    await updateDoc(docRef, updateData);
  }

  /**
   * Delete a document in the collection/subcollection by ID
   * @param id - Document ID to delete
   * @example
   * // Delete equipment in subcollection
   * const gym = await Gym.load('gym123');
   * await gym.subcollection('equipments').destroy('equipment123');
   */
  async destroy(id: string): Promise<void> {
    const collectionRef = this.getCollectionRef();
    const docRef = doc(collectionRef, id);
    await deleteDoc(docRef);
  }

  /**
   * Delete all documents matching the query
   * Uses batches to handle large datasets (500 docs per batch)
   * @returns Promise with the number of documents deleted
   * @example
   * // Delete all inactive users
   * const deleted = await User.where('status', '==', 'inactive').deleteAll();
   * console.log(`Deleted ${deleted} users`);
   *
   * // Delete all equipment in a subcollection
   * const gym = await Gym.load('gym123');
   * await gym.subcollection('equipments').deleteAll();
   */
  async deleteAll(): Promise<number> {
    const firestore = ModelFactory.getFirestore();
    const docs = await this.get();

    if (docs.length === 0) {
      return 0;
    }

    const BATCH_SIZE = 500;
    let deletedCount = 0;

    // Process in batches of 500
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(firestore);
      const batchDocs = docs.slice(i, i + BATCH_SIZE);

      batchDocs.forEach((docData) => {
        const collectionRef = this.getCollectionRef();
        const docRef = doc(collectionRef, docData.id);
        batch.delete(docRef);
      });

      await batch.commit();
      deletedCount += batchDocs.length;
    }

    return deletedCount;
  }

  /**
   * Clone query builder
   */
  clone(): QueryBuilder<M> {
    const cloned = new QueryBuilder(
      this.modelConstructor,
      this.customCollectionRef
    );
    cloned.constraints = [...this.constraints];
    return cloned;
  }
}
