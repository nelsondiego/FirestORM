/**
 * Firestore query operators
 */
export type WhereOperator =
  | '=='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'in'
  | 'not-in'
  | 'array-contains'
  | 'array-contains-any';

/**
 * Order direction for queries
 */
export type OrderDirection = 'asc' | 'desc';

/**
 * Base attributes that all models have
 */
export interface ModelAttributes {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
