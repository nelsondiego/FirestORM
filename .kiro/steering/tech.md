# Technical Stack

## Build System

- **Bundler**: Rollup
- **TypeScript Compiler**: tsc via @rollup/plugin-typescript
- **Output Formats**: CommonJS (dist/index.js) and ESM (dist/index.esm.js)
- **Type Declarations**: Generated automatically in dist/

## Tech Stack

- **Language**: TypeScript 5.9+
- **Target**: ES2020
- **Module System**: ESNext (ES modules)
- **Runtime**: Node.js 16.0.0+
- **Peer Dependency**: Firebase 12.0.0+

## Dependencies

### Peer Dependencies

- `firebase` ^12.0.0 (Firestore client)

### Dev Dependencies

- Rollup for bundling
- TypeScript for compilation
- Jest for testing
- ESLint for linting
- Prettier for formatting

## Common Commands

### Development

```bash
npm run dev          # Watch mode for development
npm run build        # Build for production
```

### Testing

```bash
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### Code Quality

```bash
npm run lint         # Lint TypeScript files
npm run format       # Format code with Prettier
```

### Publishing

```bash
npm run prepublishOnly  # Runs build + test before publishing
./publish.sh            # Automated publish script
```

## Build Configuration

- **Rollup Config**: `rollup.config.mjs`
  - Generates both CJS and ESM builds
  - Creates TypeScript declarations
  - Externalizes Firebase dependencies
  - Includes source maps

- **TypeScript Config**: `tsconfig.json`
  - Strict mode enabled
  - ES2020 target
  - ESNext modules
  - Declaration maps enabled

- **ESLint Config**: `.eslintrc.js`
  - TypeScript parser
  - Ignores examples, dist, node_modules
  - Allows `any` type (necessary for generic ORM)
  - Warns on unused vars (except those prefixed with `_`)

## Module System

- **Type**: ES Module (package.json has `"type": "module"`)
- **Config Files**: Use `.mjs` extension (rollup.config.mjs, jest.config.mjs)
- **Exports**: Named exports only (no default exports)
- **External Dependencies**: Firebase modules are marked as external (not bundled)
