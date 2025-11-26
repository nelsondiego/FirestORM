# Product Overview

NDFirestORM is an Eloquent-style ORM for Firebase Firestore with TypeScript. It provides a clean, type-safe abstraction layer over Firestore's API, inspired by Laravel's Eloquent ORM.

## Core Value Proposition

- **Zero Firestore Code**: Developers never write `collection()`, `doc()`, or `getDocs()` directly
- **JSON First**: Returns plain objects by default (faster, API-ready), model instances only when needed
- **100% Type Safe**: Full TypeScript support with intelligent autocomplete
- **Cost Optimized**: Built-in patterns to reduce Firestore operations and billing

## Key Features

- Eloquent-style query builder with fluent, chainable API
- Automatic ID inclusion in all results
- Three pagination strategies (standard, simple, cursor-based)
- Real-time subscriptions with automatic JSON conversion
- Atomic transactions and batch operations
- Full subcollection support with type safety
- Field value utilities for atomic operations (increment, arrayUnion, etc.)
- Numeric ID support (auto-converted to strings for Firestore)
- Custom document IDs (perfect for Firebase Auth sync)

## Target Audience

- TypeScript/JavaScript developers using Firebase Firestore
- Teams migrating from SQL databases or other ORMs
- Developers familiar with Laravel's Eloquent ORM
- Projects requiring type-safe database operations
