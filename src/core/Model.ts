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
import { QueryBuilder } from './QueryBuilder';

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
  normalizeId(id: string | number): string;
  query(): any;
  find(id: string | number): Promise<any>;
  load(id: string | number): Promise<any>;
  listen(
    id: string | number,
    callback: (data: ModelData<M> | null) => void
  ): Unsubscribe;
};

/**
 * Transaction context for model operations
 */
export class TransactionContext {
  private operations: Array<{
    type: 'create' | 'update' | 'delete' | 'deleteSubcollection';
    model?: any;
    data?: any;
    customId?: string | number;
    parentModel?: any;
    subcollectionName?: string;
    subcollectionDocs?: any[];
  }> = [];

  /**
   * Create a new document in the transaction
   */
  async create<M extends Model>(
    ModelClass: ModelConstructor<M>,
    data: Partial<any>,
    customId?: string | number
  ): Promise<InstanceType<ModelConstructor<M>>> {
    const instance = new ModelClass(data as any);
    if (customId !== undefined) {
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
   * @overload Update by model instance
   */
  async update<M extends Model>(model: M, data: Partial<any>): Promise<M>;
  /**
   * Update a document in the transaction
   * @overload Update by ID
   */
  async update<M extends Model>(
    ModelClass: ModelConstructor<M>,
    id: string | number,
    data: Partial<any>
  ): Promise<void>;
  async update<M extends Model>(
    modelOrClass: M | ModelConstructor<M>,
    dataOrId: Partial<any> | string | number,
    maybeData?: Partial<any>
  ): Promise<M | void> {
    // Check if it's the ID-based signature
    if (
      (typeof dataOrId === 'string' || typeof dataOrId === 'number') &&
      maybeData !== undefined
    ) {
      // Update by ID: update(ModelClass, id, data)
      const ModelClass = modelOrClass as ModelConstructor<M>;
      const id = dataOrId;
      const data = maybeData;

      this.operations.push({
        type: 'update',
        model: null,
        data,
        customId: id,
        parentModel: ModelClass,
      });
      return;
    }

    // Update by model instance: update(model, data)
    const model = modelOrClass as M;
    const data = dataOrId as Partial<any>;

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
   * @overload Delete by model instance
   */
  async delete<M extends Model>(model: M): Promise<void>;
  /**
   * Delete a document in the transaction
   * @overload Delete by ID
   */
  async delete<M extends Model>(
    ModelClass: ModelConstructor<M>,
    id: string | number
  ): Promise<void>;
  async delete<M extends Model>(
    modelOrClass: M | ModelConstructor<M>,
    maybeId?: string | number
  ): Promise<void> {
    // Check if it's the ID-based signature
    if (maybeId !== undefined) {
      // Delete by ID: delete(ModelClass, id)
      const ModelClass = modelOrClass as ModelConstructor<M>;
      const id = maybeId;

      this.operations.push({
        type: 'delete',
        model: null,
        customId: id,
        parentModel: ModelClass,
      });
      return;
    }

    // Delete by model instance: delete(model)
    const model = modelOrClass as M;

    this.operations.push({
      type: 'delete',
      model,
    });
  }

  /**
   * Delete all documents in a subcollection within the transaction
   * @param parentModel - Parent model instance
   * @param subcollectionName - Name of the subcollection to delete
   * @example
   * await Gym.transaction(async (ctx) => {
   *   const gym = await Gym.load('gym123');
   *   if (gym) {
   *     await ctx.deleteSubcollection(gym, 'equipments');
   *     await ctx.deleteSubcollection(gym, 'members');
   *     await ctx.delete(gym);
   *   }
   * });
   */
  async deleteSubcollection<M extends Model>(
    parentModel: M,
    subcollectionName: string
  ): Promise<void> {
    if (!parentModel.id) {
      throw new Error('Cannot delete subcollection without parent document ID');
    }

    // Get all documents in the subcollection
    const subcollectionDocs = await parentModel
      .subcollection(subcollectionName)
      .get();

    this.operations.push({
      type: 'deleteSubcollection',
      parentModel,
      subcollectionName,
      subcollectionDocs,
    });
  }

  /**
   * Delete a document and all its subcollections atomically
   * @param model - Model instance to delete
   * @param options - Cascade delete options
   * @example
   * await Gym.transaction(async (ctx) => {
   *   const gym = await Gym.load('gym123');
   *   if (gym) {
   *     await ctx.deleteCascade(gym, {
   *       subcollections: ['equipments', 'members', 'features']
   *     });
   *   }
   * });
   */
  async deleteCascade<M extends Model>(
    model: M,
    options: {
      subcollections?: string[];
      onBeforeDelete?: () => Promise<void>;
    } = {}
  ): Promise<void> {
    const { subcollections = [], onBeforeDelete } = options;

    // Execute before delete hook
    if (onBeforeDelete) {
      await onBeforeDelete();
    }

    // Delete all subcollections
    for (const subcollectionName of subcollections) {
      await this.deleteSubcollection(model, subcollectionName);
    }

    // Delete the parent document
    await this.delete(model);
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
    customId?: string | number;
    ModelClass?: any;
    id?: string | number;
  }> = [];

  /**
   * Create a new document in the batch
   */
  create<M extends Model>(
    ModelClass: ModelConstructor<M>,
    data: Partial<any>,
    customId?: string | number
  ): InstanceType<ModelConstructor<M>> {
    const instance = new ModelClass(data as any);
    if (customId !== undefined) {
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
   * @overload Update by model instance
   */
  update<M extends Model>(model: M, data: Partial<any>): M;
  /**
   * Update a document in the batch
   * @overload Update by ID
   */
  update<M extends Model>(
    ModelClass: ModelConstructor<M>,
    id: string | number,
    data: Partial<any>
  ): void;
  update<M extends Model>(
    modelOrClass: M | ModelConstructor<M>,
    dataOrId: Partial<any> | string | number,
    maybeData?: Partial<any>
  ): M | void {
    // Check if it's the ID-based signature
    if (
      (typeof dataOrId === 'string' || typeof dataOrId === 'number') &&
      maybeData !== undefined
    ) {
      // Update by ID: update(ModelClass, id, data)
      const ModelClass = modelOrClass as ModelConstructor<M>;
      const id = dataOrId;
      const data = maybeData;

      this.operations.push({
        type: 'update',
        ModelClass,
        id,
        data,
        model: null,
      });
      return;
    }

    // Update by model instance: update(model, data)
    const model = modelOrClass as M;
    const data = dataOrId as Partial<any>;

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
   * @overload Delete by model instance
   */
  delete<M extends Model>(model: M): void;
  /**
   * Delete a document in the batch
   * @overload Delete by ID
   */
  delete<M extends Model>(
    ModelClass: ModelConstructor<M>,
    id: string | number
  ): void;
  delete<M extends Model>(
    modelOrClass: M | ModelConstructor<M>,
    maybeId?: string | number
  ): void {
    // Check if it's the ID-based signature
    if (maybeId !== undefined) {
      // Delete by ID: delete(ModelClass, id)
      const ModelClass = modelOrClass as ModelConstructor<M>;
      const id = maybeId;

      this.operations.push({
        type: 'delete',
        ModelClass,
        id,
        model: null,
      });
      return;
    }

    // Delete by model instance: delete(model)
    const model = modelOrClass as M;

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
   * Normalize ID to string (Firestore only supports string IDs)
   * @param id - ID as string or number
   * @returns ID as string
   */
  static normalizeId(id: string | number): string {
    return typeof id === 'number' ? id.toString() : id;
  }

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
  static query<M extends Model>(
    this: ModelConstructor<M>
  ): QueryBuilder<InstanceType<ModelConstructor<M>>> {
    return new QueryBuilder(this) as QueryBuilder<
      InstanceType<ModelConstructor<M>>
    >;
  }

  /**
   * Add where constraint
   */
  static where<M extends Model>(
    this: ModelConstructor<M>,
    field: string,
    operator: any,
    value: any
  ): QueryBuilder<InstanceType<ModelConstructor<M>>> {
    return this.query().where(field, operator, value);
  }

  /**
   * Access a subcollection from a parent document
   * @param parentId - ID of the parent document
   * @param subcollectionName - Name of the subcollection
   * @returns QueryBuilder for the subcollection
   * @example
   * // Get all equipment for a gym
   * const equipments = await Gym.subcollection('gym123', 'equipments').get();
   *
   * // Query subcollection
   * const activeEquipments = await Gym.subcollection('gym123', 'equipments')
   *   .where('status', '==', 'active')
   *   .get();
   */
  static subcollection<M extends Model>(
    this: ModelConstructor<M>,
    parentId: string | number,
    subcollectionName: string
  ): QueryBuilder<InstanceType<ModelConstructor<M>>>;
  /**
   * Access a typed subcollection from a parent document
   * @param parentId - ID of the parent document
   * @param SubcollectionModel - Model class for the subcollection
   * @returns QueryBuilder for the subcollection with proper typing
   * @example
   * // Get all equipment for a gym (typed)
   * const equipments = await Gym.subcollection('gym123', Equipment).get();
   */
  static subcollection<M extends Model, SubM extends Model>(
    this: ModelConstructor<M>,
    parentId: string | number,
    SubcollectionModel: ModelConstructor<SubM>
  ): QueryBuilder<InstanceType<ModelConstructor<SubM>>>;
  static subcollection<M extends Model, SubM extends Model>(
    this: ModelConstructor<M>,
    parentId: string | number,
    subcollectionNameOrModel: string | ModelConstructor<SubM>
  ):
    | QueryBuilder<InstanceType<ModelConstructor<M>>>
    | QueryBuilder<InstanceType<ModelConstructor<SubM>>> {
    const firestore = ModelFactory.getFirestore();
    const normalizedParentId = this.normalizeId(parentId);
    const parentDocRef = doc(
      firestore,
      this.collectionName,
      normalizedParentId
    );

    let subcollectionName: string;
    let SubcollectionModel: ModelConstructor<any>;

    // Check if it's a Model class
    if (typeof subcollectionNameOrModel === 'function') {
      SubcollectionModel = subcollectionNameOrModel;
      subcollectionName = SubcollectionModel.collectionName;
    } else {
      // String-based subcollection (legacy)
      subcollectionName = subcollectionNameOrModel;
      SubcollectionModel = this;
    }

    const subcollectionRef = collection(parentDocRef, subcollectionName);

    // Create a QueryBuilder with the subcollection reference
    return new QueryBuilder(SubcollectionModel, subcollectionRef) as any;
  }

  /**
   * Find by ID and return as plain JSON
   */
  static async find<M extends Model>(
    this: ModelConstructor<M>,
    id: string | number
  ): Promise<ModelData<InstanceType<ModelConstructor<M>>> | null> {
    const normalizedId = this.normalizeId(id);
    return this.query().find(normalizedId);
  }

  /**
   * Load a model instance by ID (for updates/deletes)
   */
  static async load<M extends Model>(
    this: ModelConstructor<M>,
    id: string | number
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
    id: string | number
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
    customId?: string | number
  ): Promise<InstanceType<ModelConstructor<M>>> {
    const instance = new this(data as any);
    if (customId !== undefined) {
      (instance as any).attributes.id = customId;
    }
    await instance.save();
    return instance as InstanceType<ModelConstructor<M>>;
  }

  /**
   * Update by ID without loading the model first
   * @param id - Document ID to update
   * @param data - Partial data to update
   * @example
   * await User.update('user123', { name: 'New Name', age: 30 });
   * await City.update(12345, { name: 'New City Name' });
   */
  static async update<M extends Model>(
    this: ModelConstructor<M>,
    id: string | number,
    data: Partial<any>
  ): Promise<void> {
    const collectionRef = this.getCollectionRef();
    const normalizedId = this.normalizeId(id);
    const docRef = doc(collectionRef, normalizedId);

    // Prepare update data with timestamp
    const updateData: any = { ...data };
    delete updateData.id; // Remove id if present
    updateData.updatedAt = serverTimestamp();

    await updateDoc(docRef, updateData);
  }

  /**
   * Delete by ID
   */
  static async destroy<M extends Model>(
    this: ModelConstructor<M>,
    id: string | number
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
    id: string | number,
    callback: (
      data: ModelData<InstanceType<ModelConstructor<M>>> | null
    ) => void
  ): Unsubscribe {
    const collectionRef = this.getCollectionRef();
    const normalizedId = this.normalizeId(id);
    const docRef = doc(collectionRef, normalizedId);

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
        if (op.type === 'deleteSubcollection') {
          // Delete all documents in the subcollection
          const subcollectionDocs = op.subcollectionDocs || [];
          const parentModel = op.parentModel;
          const subcollectionName = op.subcollectionName;

          if (!parentModel || !subcollectionName) {
            throw new Error('Invalid subcollection delete operation');
          }

          const parentCollectionRef = (
            parentModel.constructor as any
          ).getCollectionRef();
          const normalizedParentId = (
            parentModel.constructor as any
          ).normalizeId(parentModel.attributes.id);
          const parentDocRef = doc(parentCollectionRef, normalizedParentId);

          for (const docData of subcollectionDocs) {
            const subcollectionDocRef = doc(
              collection(parentDocRef, subcollectionName),
              docData.id
            );
            transaction.delete(subcollectionDocRef);
          }
        } else if (op.type === 'create') {
          const model = op.model;
          const collectionRef = (model.constructor as any).getCollectionRef();
          const dataToSave = model.prepareDataForSave();

          if (model.attributes.id !== undefined) {
            const normalizedId = (model.constructor as any).normalizeId(
              model.attributes.id
            );
            const docRef = doc(collectionRef, normalizedId);
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
          // Check if it's ID-based update
          if (op.parentModel && op.customId !== undefined) {
            // Update by ID
            const ModelClass = op.parentModel as ModelConstructor<any>;
            const collectionRef = ModelClass.getCollectionRef();
            const normalizedId = ModelClass.normalizeId(op.customId);
            const docRef = doc(collectionRef, normalizedId);

            // Prepare update data with timestamp
            const updateData: any = { ...op.data };
            delete updateData.id;
            updateData.updatedAt = serverTimestamp();

            transaction.update(docRef, updateData);
          } else {
            // Update by model instance
            const model = op.model;
            const collectionRef = (model.constructor as any).getCollectionRef();

            if (model.attributes.id === undefined) {
              throw new Error('Cannot update model without ID');
            }

            const normalizedId = (model.constructor as any).normalizeId(
              model.attributes.id
            );
            const docRef = doc(collectionRef, normalizedId);
            const dataToUpdate = model.prepareDataForSave(true);
            transaction.update(docRef, dataToUpdate);
            model.original = { ...model.attributes };
          }
        } else if (op.type === 'delete') {
          // Check if it's ID-based delete
          if (op.parentModel && op.customId !== undefined) {
            // Delete by ID
            const ModelClass = op.parentModel as ModelConstructor<any>;
            const collectionRef = ModelClass.getCollectionRef();
            const normalizedId = ModelClass.normalizeId(op.customId);
            const docRef = doc(collectionRef, normalizedId);
            transaction.delete(docRef);
          } else {
            // Delete by model instance
            const model = op.model;
            const collectionRef = (model.constructor as any).getCollectionRef();

            if (model.attributes.id === undefined) {
              throw new Error('Cannot delete model without ID');
            }

            const normalizedId = (model.constructor as any).normalizeId(
              model.attributes.id
            );
            const docRef = doc(collectionRef, normalizedId);
            transaction.delete(docRef);
            model.exists = false;
          }
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
   *   // Update by ID (no need to load)
   *   ctx.update(User, 'user1', { status: 'active' });
   *
   *   // Or update with model instance
   *   const user = await User.load('user2');
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
      if (op.type === 'create') {
        const model = op.model;
        const collectionRef = (model.constructor as any).getCollectionRef();
        const dataToSave = model.prepareDataForSave();

        if (model.attributes.id !== undefined) {
          const normalizedId = (model.constructor as any).normalizeId(
            model.attributes.id
          );
          const docRef = doc(collectionRef, normalizedId);
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
        // Check if it's ID-based update
        if (op.ModelClass && op.id !== undefined) {
          // Update by ID
          const collectionRef = op.ModelClass.getCollectionRef();
          const normalizedId = op.ModelClass.normalizeId(op.id);
          const docRef = doc(collectionRef, normalizedId);

          // Prepare update data with timestamp
          const updateData: any = { ...op.data };
          delete updateData.id;
          updateData.updatedAt = serverTimestamp();

          batch.update(docRef, updateData);
        } else {
          // Update by model instance
          const model = op.model;
          const collectionRef = (model.constructor as any).getCollectionRef();

          if (model.attributes.id === undefined) {
            throw new Error('Cannot update model without ID');
          }

          const normalizedId = (model.constructor as any).normalizeId(
            model.attributes.id
          );
          const docRef = doc(collectionRef, normalizedId);
          const dataToUpdate = model.prepareDataForSave(true);
          batch.update(docRef, dataToUpdate);
          model.original = { ...model.attributes };
        }
      } else if (op.type === 'delete') {
        // Check if it's ID-based delete
        if (op.ModelClass && op.id !== undefined) {
          // Delete by ID
          const collectionRef = op.ModelClass.getCollectionRef();
          const normalizedId = op.ModelClass.normalizeId(op.id);
          const docRef = doc(collectionRef, normalizedId);
          batch.delete(docRef);
        } else {
          // Delete by model instance
          const model = op.model;
          const collectionRef = (model.constructor as any).getCollectionRef();

          if (model.attributes.id === undefined) {
            throw new Error('Cannot delete model without ID');
          }

          const normalizedId = (model.constructor as any).normalizeId(
            model.attributes.id
          );
          const docRef = doc(collectionRef, normalizedId);
          batch.delete(docRef);
          model.exists = false;
        }
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
    if (this.attributes.id === undefined) {
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
   * Access a subcollection from this model instance
   * @param subcollectionName - Name of the subcollection
   * @returns QueryBuilder for the subcollection
   * @example
   * const gym = await Gym.load('gym123');
   * const equipments = await gym.subcollection('equipments').get();
   */
  subcollection(subcollectionName: string): QueryBuilder<this>;
  /**
   * Access a typed subcollection from this model instance
   * @param SubcollectionModel - Model class for the subcollection
   * @returns QueryBuilder for the subcollection with proper typing
   * @example
   * const gym = await Gym.load('gym123');
   * const equipments = await gym.subcollection(Equipment).get();
   */
  subcollection<SubM extends Model>(
    SubcollectionModel: ModelConstructor<SubM>
  ): QueryBuilder<InstanceType<ModelConstructor<SubM>>>;
  subcollection<SubM extends Model>(
    subcollectionNameOrModel: string | ModelConstructor<SubM>
  ): QueryBuilder<this> | QueryBuilder<InstanceType<ModelConstructor<SubM>>> {
    if (this.attributes.id === undefined) {
      throw new Error('Cannot access subcollection without document ID');
    }

    // Check if it's a Model class
    if (typeof subcollectionNameOrModel === 'function') {
      const SubcollectionModel = subcollectionNameOrModel;
      const subcollectionName = SubcollectionModel.collectionName;

      return (this.constructor as any).subcollection(
        this.attributes.id,
        subcollectionName
      ) as QueryBuilder<InstanceType<ModelConstructor<SubM>>>;
    }

    // String-based subcollection (legacy)
    return (this.constructor as any).subcollection(
      this.attributes.id,
      subcollectionNameOrModel
    ) as QueryBuilder<this>;
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
  get id(): string | number | undefined {
    return this.attributes.id;
  }

  // ============================================
  // PROTECTED METHODS
  // ============================================

  protected async performCreate(): Promise<void> {
    const collectionRef = (this.constructor as any).getCollectionRef();
    const dataToSave = this.prepareDataForSave();

    // If ID is already set, use setDoc instead of addDoc
    if (this.attributes.id !== undefined) {
      const normalizedId = (this.constructor as any).normalizeId(
        this.attributes.id
      );
      const docRef = doc(collectionRef, normalizedId);
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
    if (this.attributes.id === undefined) {
      throw new Error('Cannot update model without ID');
    }

    const collectionRef = (this.constructor as any).getCollectionRef();
    const normalizedId = (this.constructor as any).normalizeId(
      this.attributes.id
    );
    const docRef = doc(collectionRef, normalizedId);
    const dataToUpdate = this.prepareDataForSave(true);

    await updateDoc(docRef, dataToUpdate);
    this.original = { ...this.attributes };
  }

  protected async performDelete(): Promise<void> {
    const collectionRef = (this.constructor as any).getCollectionRef();
    const normalizedId = (this.constructor as any).normalizeId(
      this.attributes.id!
    );
    const docRef = doc(collectionRef, normalizedId);

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
