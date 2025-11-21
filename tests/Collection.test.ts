import { Collection } from '../src/core/Collection';

describe('Collection', () => {
  const items = [
    { id: '1', name: 'John', age: 25 },
    { id: '2', name: 'Jane', age: 30 },
    { id: '3', name: 'Bob', age: 35 },
  ];

  let collection: Collection<typeof items[0]>;

  beforeEach(() => {
    collection = new Collection(items);
  });

  describe('all()', () => {
    it('should return all items', () => {
      expect(collection.all()).toEqual(items);
    });
  });

  describe('first()', () => {
    it('should return first item', () => {
      expect(collection.first()).toEqual(items[0]);
    });

    it('should return undefined for empty collection', () => {
      const empty = new Collection([]);
      expect(empty.first()).toBeUndefined();
    });
  });

  describe('last()', () => {
    it('should return last item', () => {
      expect(collection.last()).toEqual(items[2]);
    });
  });

  describe('count()', () => {
    it('should return correct count', () => {
      expect(collection.count()).toBe(3);
    });
  });

  describe('isEmpty()', () => {
    it('should return false for non-empty collection', () => {
      expect(collection.isEmpty()).toBe(false);
    });

    it('should return true for empty collection', () => {
      const empty = new Collection([]);
      expect(empty.isEmpty()).toBe(true);
    });
  });

  describe('isNotEmpty()', () => {
    it('should return true for non-empty collection', () => {
      expect(collection.isNotEmpty()).toBe(true);
    });

    it('should return false for empty collection', () => {
      const empty = new Collection([]);
      expect(empty.isNotEmpty()).toBe(false);
    });
  });

  describe('map()', () => {
    it('should map over items', () => {
      const names = collection.map((item) => item.name);
      expect(names).toEqual(['John', 'Jane', 'Bob']);
    });
  });

  describe('filter()', () => {
    it('should filter items', () => {
      const filtered = collection.filter((item) => item.age > 25);
      expect(filtered.count()).toBe(2);
      expect(filtered.all()).toEqual([items[1], items[2]]);
    });
  });

  describe('find()', () => {
    it('should find item', () => {
      const found = collection.find((item) => item.name === 'Jane');
      expect(found).toEqual(items[1]);
    });

    it('should return undefined if not found', () => {
      const found = collection.find((item) => item.name === 'Unknown');
      expect(found).toBeUndefined();
    });
  });

  describe('pluck()', () => {
    it('should pluck values by key', () => {
      const names = collection.pluck('name');
      expect(names).toEqual(['John', 'Jane', 'Bob']);
    });
  });

  describe('toArray()', () => {
    it('should return array', () => {
      expect(collection.toArray()).toEqual(items);
    });
  });

  describe('some()', () => {
    it('should return true if any item matches', () => {
      expect(collection.some((item) => item.age > 30)).toBe(true);
    });

    it('should return false if no item matches', () => {
      expect(collection.some((item) => item.age > 40)).toBe(false);
    });
  });

  describe('every()', () => {
    it('should return true if all items match', () => {
      expect(collection.every((item) => item.age > 20)).toBe(true);
    });

    it('should return false if not all items match', () => {
      expect(collection.every((item) => item.age > 30)).toBe(false);
    });
  });
});
