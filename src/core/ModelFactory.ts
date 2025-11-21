import { Firestore } from 'firebase/firestore';

/**
 * Configuration options for the ORM
 */
export interface OrmConfig {
  timestamps?: boolean;
  softDeletes?: boolean;
  cache?: {
    enabled: boolean;
    ttl?: number;
  };
}

/**
 * Default ORM configuration
 */
export const defaultConfig: OrmConfig = {
  timestamps: true,
  softDeletes: false,
  cache: {
    enabled: false,
    ttl: 300000, // 5 minutes
  },
};

/**
 * Factory for managing Firestore instance and configuration
 */
export class ModelFactory {
  private static firestore: Firestore;
  private static config: OrmConfig;

  /**
   * Initialize the ORM with Firestore instance and configuration
   */
  static initialize(firestore: Firestore, config?: Partial<OrmConfig>): void {
    this.firestore = firestore;
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Get the Firestore instance
   */
  static getFirestore(): Firestore {
    if (!this.firestore) {
      throw new Error(
        'Firestore not initialized. Call ModelFactory.initialize() first.'
      );
    }
    return this.firestore;
  }

  /**
   * Get the ORM configuration
   */
  static getConfig(): OrmConfig {
    return this.config;
  }
}
