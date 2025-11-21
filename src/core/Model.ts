import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  runTransaction,
  writeBatch,
  CollectionReference,
  Unsubscribe,
  DocumentSnapshot,
} from 'firebase/firestore';
import { ModelFactory } from './ModelFactory';
import { ModelAttributes } from '../types';
import { ModelNotFoundError } from '../errors/ModelNotFoundError';

// ============================================
// TYPE UTILITIES
// ============================================

// Re-export ModelAttributes for convenience
export type { ModelAttributes } from '../types';

/**
 * Extract the data type from Model
 * @example
 * type UserData = ModelData<User>;
 */
export type ModelData<M extends Model> = M extends Model<infer T> ? T : any;

/**
 * Infer the type from a Model class
 * @example
 * type UserType = InferModelType<typeof User>;
 */
export type InferModelType<T> =
  T extends ModelConstructor<infer M> ? ModelData<M> : never;

/**
 * Type alias for model data
 */
export type ModelType<M extends Model> = ModelData<M>;

/**
 * Type for creating a new model (without id, timestamps)
 */
export type CreateModelData<M extends Model> = Omit<
  ModelData<M>,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

/**
 * Type for updating a model (partial, without id)
 */
export type UpdateModelData<M extends Model> = Partial<
  Omit<ModelData<M>, 'id' | 'createdAt'>
>;

/**
 * Model constructor type
 */
export type ModelConstructor<M extends Model> = {
  new (data?: any): M;
  collectionName: string;
  getCollectionRef(): CollectionReference;
  query(): any;
  find(id: string): Promise<any>;
  load(id: string): Promise<any>;
  listen(
    id: string,
    callback: (data: ModelData<M> | null) => void
  ): Unsubscribe;
};

/**
 * Transaction context for model operations
 */
export class TransactionContext {
  private operations: Array<{
    type: 'create' | 'update' | 'delete';
    model: any;
    data?: any;
    customId?: string;
  }> = [];

  /**
   * Create a new document in the transaction
   */
  async create<M extends Model>(
    ModelClass: ModelConstructor<M>,
    data: Partial<any>,
    customId?: string
  ): Promise<InstanceType<ModelConstructor<M>>> {
    const instance = new ModelClass(data as any);
    if (customId) {
      (instance as any).attributes.id = customId;
    }

    this.operations.push({
      type: 'create',
      model: instance,
      data,
      customId,
    });

    return instance as InstanceType<ModelConstructor<M>>;
  }

  /**
   * Update a document in the transaction
   */
  async update<M extends Model>(model: M, data: Partial<any>): Promise<M> {
    model.fill(data);

    this.operations.push({
      type: 'update',
      model,
      data,
    });

    return model;
  }

  /**
   * Delete a document in the transaction
   */
  async delete<M extends Model>(model: M): Promise<void> {
    this.operations.push({
      type: 'delete',
      model,
    });
  }

  /**
   * Get all operations
   */
  getOperations() {
    return this.operations;
  }
}

/**
 * Transaction callback type
 */
export type TransactionCallback<T> = (ctx: TransactionContext) => Promise<T>;

/**
 * Batch context for model operations
 */
export class BatchContext {
  private operations: Array<{
    type: 'create' | 'update' | 'delete';
    model: any;
    data?: any;
    customId?: string;
  }> = [];

  /**
   * Create a new document in the batch
   */
  create<M extends Model>(
    ModelClass: ModelConstructor<M>,
    data: Partial<any>,
    customId?: string
  ): InstanceType<ModelConstructor<M>> {
    const instance = new ModelClass(data as any);
    if (customId) {
      (instance as any).attributes.id = customId;
    }

    this.operations.push({
      type: 'create',
      model: instance,
      data,
      customId,
    });

    return instance as InstanceType<ModelConstructor<M>>;
  }

  /**
   * Update a document in the batch
   */
  update<M extends Model>(model: M, data: Partial<any>): M {
    model.fill(data);

    this.operations.push({
      type: 'update',
      model,
      data,
    });

    return model;
  }

  /**
   * Delete a document in the batch
   */
  delete<M extends Model>(model: M): void {
    this.operations.push({
      type: 'delete',
      model,
    });
  }

  /**
   * Get all operations
   */
  getOperations() {
    return this.operations;
  }
}

/**
 * Batch callback type
 */
export type BatchCallback = (ctx: BatchContext) => void | Promise<void>;

// ============================================
// MODEL BASE CLASS
// ============================================

/**
 * Abstract base class for all models
 */
export abstract class Model<T extends ModelAttributes = any> {
  // Configuration (must be overridden)
  static collectionName: string;

  // Model data
  protected attributes: Partial<T> = {};
  protected original: Partial<T> = {};
  protected exists = false;

  // Instance configuration
  protected timestamps = true;
  protected softDeletes = false;

  constructor(data?: Partial<T>) {
    if (data) {
      this.fill(data);
      this.original = { ...data };
    }
  }

  // ============================================
  // STATIC METHODS (Factory & Query)
  // ============================================

  /**
   * Get collection reference
   */
  static getCollectionRef(): CollectionReference {
    const firestore = ModelFactory.getFirestore();
    return collection(firestore, this.collectionName);
  }

  /**
   * Create new query builder
   */
  static query<M extends Model>(this: ModelConstructor<M>): any {
    // Lazy import to avoid circular dependency
    const { QueryBuilder } = require('./QueryBuilder');
    return new QueryBuilder(this);
  }

  /**
   * Add where constraint
   */
  static where<M extends Model>(
    this: ModelConstructor<M>,
    field: string,
    operator: any,
    value: any
  ): any {
    return this.query().where(field, operator, value);
  }

  /**
   * Find by ID and return as plain JSON
   */
  static async find<M extends Model>(
    this: ModelConstructor<M>,
    id: string
  ): Promise<ModelData<InstanceType<ModelConstructor<M>>> | null> {
    return this.query().find(id);
  }

  /**
   * Load a model instance by ID (for updates/deletes)
   */
  static async load<M extends Model>(
    this: ModelConstructor<M>,
    id: string
  ): Promise<InstanceType<ModelConstructor<M>> | null> {
    const data = await this.find(id);
    if (!data) return null;

    const instance = new this(data as any);
    (instance as any).exists = true;
    (instance as any).original = { ...data };
    return instance as InstanceType<ModelConstructor<M>>;
  }

  /**
   * Find by ID or throw error - Typed
   */
  static async findOrFail<M extends Model>(
    this: ModelConstructor<M>,
    id: string
  ): Promise<ModelData<InstanceType<ModelConstructor<M>>>> {
    const model = await this.find(id);
    if (!model) {
      throw new ModelNotFoundError(`Model not found with id: ${id}`);
    }
    return model;
  }

  /**
   * Get all documents as plain JSON
   */
  static async all<M extends Model>(
    this: ModelConstructor<M>
  ): Promise<ModelData<InstanceType<ModelConstructor<M>>>[]> {
    return this.query().get();
  }

  /**
   * Create new document and return Model instance
   * @param data - Data for the new document
   * @param customId - Optional custom ID for the document
   */
  static async create<M extends Model>(
    this: ModelConstructor<M>,
    data: Partial<any>,
    customId?: string
  ): Promise<InstanceType<ModelConstructor<M>>> {
    const instance = new this(data as any);
    if (customId) {
      (instance as any).attributes.id = customId;
    }
    await instance.save();
    return instance as InstanceType<ModelConstructor<M>>;
  }

  /**
   * Delete by ID
   */
  static async destroy<M extends Model>(
    this: ModelConstructor<M>,
    id: string
  ): Promise<void> {
    const docData = await this.find(id);
    if (docData) {
      const model = new this(docData as any);
      (model as any).exists = true;
      await model.delete();
    }
  }

  /**
   * Listen to real-time updates for a document (returns JSON)
   * @param id - Document ID to listen to
   * @param callback - Callback function that receives the document data as JSON or null
   * @returns Unsubscribe function
   */
  static listen<M extends Model>(
    this: ModelConstructor<M>,
    id: string,
    callback: (
      data: ModelData<InstanceType<ModelConstructor<M>>> | null
    ) => void
  ): Unsubscribe {
    const collectionRef = this.getCollectionRef();
    const docRef = doc(collectionRef, id);

    return onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() };
          callback(data as ModelData<InstanceType<ModelConstructor<M>>>);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to document:', error);
        callback(null);
      }
    );
  }

  /**
   * Run a Firestore transaction with model operations
   * @param callback - Transaction callback that receives a context for model operations
   * @returns Promise with the transaction result
   * @example
   * await User.transaction(async (ctx) => {
   *   const user = await User.load('user1');
   *   const gym = await Gym.load('gym1');
   *
   *   if (user && gym) {
   *     await ctx.update(user, { gymId: gym.id });
   *     await ctx.update(gym, { memberCount: gym.get('memberCount') + 1 });
   *   }
   * });
   */
  static async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
    const firestore = ModelFactory.getFirestore();
    const ctx = new TransactionContext();

    // Execute user callback to collect operations
    const result = await callback(ctx);

    // Execute all operations in a Firestore transaction
    await runTransaction(firestore, async (transaction) => {
      const operations = ctx.getOperations();

      for (const op of operations) {
        const model = op.model;
        const collectionRef = (model.constructor as any).getCollectionRef();

        if (op.type === 'create') {
          const dataToSave = model.prepareDataForSave();

          if (model.attributes.id) {
            const docRef = doc(collectionRef, model.attributes.id);
            transaction.set(docRef, dataToSave);
          } else {
            // Generate ID for transaction
            const docRef = doc(collectionRef);
            model.attributes.id = docRef.id;
            transaction.set(docRef, dataToSave);
          }

          model.exists = true;
          model.original = { ...model.attributes };
        } else if (op.type === 'update') {
          if (!model.attributes.id) {
            throw new Error('Cannot update model without ID');
          }

          const docRef = doc(collectionRef, model.attributes.id);
          const dataToUpdate = model.prepareDataForSave(true);
          transaction.update(docRef, dataToUpdate);
          model.original = { ...model.attributes };
        } else if (op.type === 'delete') {
          if (!model.attributes.id) {
            throw new Error('Cannot delete model without ID');
          }

          const docRef = doc(collectionRef, model.attributes.id);
          transaction.delete(docRef);
          model.exists = false;
        }
      }
    });

    return result;
  }

  /**
   * Run a Firestore batch operation with model operations
   * @param callback - Batch callback that receives a context for model operations
   * @returns Promise that resolves when batch is committed
   * @example
   * await User.batch(async (ctx) => {
   *   ctx.create(User, { name: 'John', email: 'john@example.com' });
   *   ctx.create(User, { name: 'Jane', email: 'jane@example.com' });
   *
   *   const user = await User.load('user1');
   *   if (user) {
   *     ctx.update(user, { status: 'active' });
   *   }
   * });
   */
  static async batch(callback: BatchCallback): Promise<void> {
    const firestore = ModelFactory.getFirestore();
    const batch = writeBatch(firestore);
    const ctx = new BatchContext();

    // Execute user callback to collect operations
    await callback(ctx);

    // Execute all operations in a Firestore batch
    const operations = ctx.getOperations();

    for (const op of operations) {
      const model = op.model;
      const collectionRef = (model.constructor as any).getCollectionRef();

      if (op.type === 'create') {
        const dataToSave = model.prepareDataForSave();

        if (model.attributes.id) {
          const docRef = doc(collectionRef, model.attributes.id);
          batch.set(docRef, dataToSave);
        } else {
          // Generate ID for batch
          const docRef = doc(collectionRef);
          model.attributes.id = docRef.id;
          batch.set(docRef, dataToSave);
        }

        model.exists = true;
        model.original = { ...model.attributes };
      } else if (op.type === 'update') {
        if (!model.attributes.id) {
          throw new Error('Cannot update model without ID');
        }

        const docRef = doc(collectionRef, model.attributes.id);
        const dataToUpdate = model.prepareDataForSave(true);
        batch.update(docRef, dataToUpdate);
        model.original = { ...model.attributes };
      } else if (op.type === 'delete') {
        if (!model.attributes.id) {
          throw new Error('Cannot delete model without ID');
        }

        const docRef = doc(collectionRef, model.attributes.id);
        batch.delete(docRef);
        model.exists = false;
      }
    }

    return batch.commit();
  }

  // ============================================
  // INSTANCE METHODS
  // ============================================

  /**
   * Save model to Firestore
   */
  async save(): Promise<this> {
    if (this.exists) {
      await this.performUpdate();
    } else {
      await this.performCreate();
    }
    return this;
  }

  /**
   * Update model
   */
  async update(data: Partial<T>): Promise<this> {
    this.fill(data);
    await this.save();
    return this;
  }

  /**
   * Delete model
   */
  async delete(): Promise<void> {
    if (!this.exists || !this.attributes.id) {
      throw new Error('Cannot delete a model that does not exist');
    }

    if (this.softDeletes) {
      await this.performSoftDelete();
    } else {
      await this.performDelete();
    }
  }

  /**
   * Refresh model from database
   */
  async refresh(): Promise<this> {
    if (!this.attributes.id) {
      throw new Error('Cannot refresh a model without an ID');
    }

    const fresh = await (this.constructor as any).load(this.attributes.id);
    if (fresh) {
      this.attributes = fresh.attributes;
      this.original = { ...fresh.attributes };
    }

    return this;
  }

  /**
   * Fill model with data
   */
  fill(data: Partial<T>): this {
    this.attributes = { ...this.attributes, ...data };
    return this;
  }

  /**
   * Check if model has unsaved changes
   */
  isDirty(): boolean {
    return JSON.stringify(this.attributes) !== JSON.stringify(this.original);
  }

  /**
   * Get model as plain object (always includes id)
   */
  toJSON(): T {
    return {
      id: this.attributes.id,
      ...this.attributes,
    } as T;
  }

  /**
   * Get attribute value
   */
  get<K extends keyof T>(key: K): T[K] | undefined {
    return this.attributes[key];
  }

  /**
   * Set attribute value
   */
  set<K extends keyof T>(key: K, value: T[K]): this {
    this.attributes[key] = value;
    return this;
  }

  /**
   * Get id (convenience method)
   */
  get id(): string | undefined {
    return this.attributes.id;
  }

  // ============================================
  // PROTECTED METHODS
  // ============================================

  protected async performCreate(): Promise<void> {
    const collectionRef = (this.constructor as any).getCollectionRef();
    const dataToSave = this.prepareDataForSave();

    // If ID is already set, use setDoc instead of addDoc
    if (this.attributes.id) {
      const docRef = doc(collectionRef, this.attributes.id);
      await setDoc(docRef, dataToSave);
      this.original = { ...this.attributes };
      this.exists = true;
    } else {
      const docRef = await addDoc(collectionRef, dataToSave);
      this.attributes.id = docRef.id;
      this.original = { ...this.attributes };
      this.exists = true;
    }
  }

  protected async performUpdate(): Promise<void> {
    if (!this.attributes.id) {
      throw new Error('Cannot update model without ID');
    }

    const collectionRef = (this.constructor as any).getCollectionRef();
    const docRef = doc(collectionRef, this.attributes.id);
    const dataToUpdate = this.prepareDataForSave(true);

    await updateDoc(docRef, dataToUpdate);
    this.original = { ...this.attributes };
  }

  protected async performDelete(): Promise<void> {
    const collectionRef = (this.constructor as any).getCollectionRef();
    const docRef = doc(collectionRef, this.attributes.id!);

    await deleteDoc(docRef);
    this.exists = false;
  }

  protected async performSoftDelete(): Promise<void> {
    this.attributes.deletedAt = new Date();
    await this.save();
  }

  protected prepareDataForSave(isUpdate = false): any {
    const data = { ...this.attributes };
    delete data.id; // Firestore handles ID separately

    if (this.timestamps) {
      if (!isUpdate) {
        data.createdAt = data.createdAt || (serverTimestamp() as any);
      }
      data.updatedAt = serverTimestamp() as any;
    }

    return data;
  }
}
