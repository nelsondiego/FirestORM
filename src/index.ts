import { Firestore } from 'firebase/firestore';
import { ModelFactory, OrmConfig } from './core/ModelFactory';

/**
 * Initialize the ORM with Firestore instance and configuration
 */
export function initializeOrm(
  firestore: Firestore,
  config?: Partial<OrmConfig>
): void {
  ModelFactory.initialize(firestore, config);
}

// ============================================
// CORE EXPORTS
// ============================================
export { Model } from './core/Model';
export { QueryBuilder } from './core/QueryBuilder';
export { Collection } from './core/Collection';
export { ModelFactory } from './core/ModelFactory';

// ============================================
// TYPE EXPORTS
// ============================================
export type {
  ModelAttributes,
  ModelData,
  InferModelType,
  ModelType,
  CreateModelData,
  UpdateModelData,
  ModelConstructor,
  TransactionCallback,
  BatchCallback,
} from './core/Model';

export { TransactionContext, BatchContext } from './core/Model';

export type { WhereOperator, OrderDirection } from './types';

export type { PaginationMeta, PaginatedResult } from './core/QueryBuilder';

// Re-export Firestore types for convenience
export type { Unsubscribe } from 'firebase/firestore';

export type { OrmConfig } from './core/ModelFactory';

// ============================================
// ERROR EXPORTS
// ============================================
export { ModelNotFoundError } from './errors/ModelNotFoundError';
export { ValidationError } from './errors/ValidationError';
