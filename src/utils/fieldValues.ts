/**
 * Firestore Field Value utilities
 *
 * These utilities allow you to perform atomic operations on fields
 * without reading the document first.
 */

import {
  increment as firestoreIncrement,
  arrayUnion as firestoreArrayUnion,
  arrayRemove as firestoreArrayRemove,
  deleteField as firestoreDeleteField,
  serverTimestamp as firestoreServerTimestamp,
  type FieldValue,
} from 'firebase/firestore';

/**
 * Increment a numeric field by the specified amount
 * @param n - Amount to increment (can be negative to decrement)
 * @returns FieldValue for increment operation
 * @example
 * await User.update('user123', {
 *   credits: increment(10), // Add 10 credits
 *   loginCount: increment(1), // Increment by 1
 *   balance: increment(-5), // Decrement by 5
 * });
 */
export function increment(n: number): FieldValue {
  return firestoreIncrement(n);
}

/**
 * Add elements to an array field (only if not already present)
 * @param elements - Elements to add to the array
 * @returns FieldValue for arrayUnion operation
 * @example
 * await User.update('user123', {
 *   tags: arrayUnion('premium', 'verified'),
 *   favoriteGyms: arrayUnion('gym1', 'gym2'),
 * });
 */
export function arrayUnion(...elements: any[]): FieldValue {
  return firestoreArrayUnion(...elements);
}

/**
 * Remove elements from an array field
 * @param elements - Elements to remove from the array
 * @returns FieldValue for arrayRemove operation
 * @example
 * await User.update('user123', {
 *   tags: arrayRemove('trial'),
 *   blockedUsers: arrayRemove('user456'),
 * });
 */
export function arrayRemove(...elements: any[]): FieldValue {
  return firestoreArrayRemove(...elements);
}

/**
 * Delete a field from a document
 * @returns FieldValue for deleteField operation
 * @example
 * await User.update('user123', {
 *   temporaryToken: deleteField(),
 *   oldField: deleteField(),
 * });
 */
export function deleteField(): FieldValue {
  return firestoreDeleteField();
}

/**
 * Set a field to the server timestamp
 * @returns FieldValue for serverTimestamp operation
 * @example
 * await User.update('user123', {
 *   lastLoginAt: serverTimestamp(),
 *   verifiedAt: serverTimestamp(),
 * });
 */
export function serverTimestamp(): FieldValue {
  return firestoreServerTimestamp();
}

// Export the FieldValue type for advanced use cases
export type { FieldValue };
