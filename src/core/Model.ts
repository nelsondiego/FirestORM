import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  CollectionReference,
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
};

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
   */
  static async create<M extends Model>(
    this: ModelConstructor<M>,
    data: Partial<any>
  ): Promise<InstanceType<ModelConstructor<M>>> {
    const instance = new this(data as any);
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

    const docRef = await addDoc(collectionRef, dataToSave);
    this.attributes.id = docRef.id;
    this.original = { ...this.attributes };
    this.exists = true;
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
