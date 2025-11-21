/**
 * Collection wrapper for arrays of models
 * Provides utility methods for working with collections
 */
export class Collection<T> {
  constructor(private items: T[] = []) {}

  /**
   * Get all items in the collection
   */
  all(): T[] {
    return this.items;
  }

  /**
   * Get the first item
   */
  first(): T | undefined {
    return this.items[0];
  }

  /**
   * Get the last item
   */
  last(): T | undefined {
    return this.items[this.items.length - 1];
  }

  /**
   * Get the count of items
   */
  count(): number {
    return this.items.length;
  }

  /**
   * Check if collection is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Check if collection is not empty
   */
  isNotEmpty(): boolean {
    return !this.isEmpty();
  }

  /**
   * Map over items
   */
  map<U>(callback: (item: T, index: number) => U): U[] {
    return this.items.map(callback);
  }

  /**
   * Filter items
   */
  filter(callback: (item: T, index: number) => boolean): Collection<T> {
    return new Collection(this.items.filter(callback));
  }

  /**
   * Find an item
   */
  find(callback: (item: T) => boolean): T | undefined {
    return this.items.find(callback);
  }

  /**
   * Pluck values by key
   */
  pluck<K extends keyof T>(key: K): T[K][] {
    return this.items.map((item) => item[key]);
  }

  /**
   * Convert to JSON array
   */
  toJSON(): any[] {
    return this.items.map((item) =>
      typeof (item as any).toJSON === 'function'
        ? (item as any).toJSON()
        : item
    );
  }

  /**
   * Get as plain array
   */
  toArray(): T[] {
    return this.all();
  }

  /**
   * Iterate over items
   */
  forEach(callback: (item: T, index: number) => void): void {
    this.items.forEach(callback);
  }

  /**
   * Check if any item matches the condition
   */
  some(callback: (item: T) => boolean): boolean {
    return this.items.some(callback);
  }

  /**
   * Check if all items match the condition
   */
  every(callback: (item: T) => boolean): boolean {
    return this.items.every(callback);
  }
}
