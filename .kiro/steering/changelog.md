# Changelog Guidelines

## Version Management

- **IMPORTANT**: Always write changes to CHANGELOG.md in a new version section
- The package.json version is updated automatically during the publish process
- Never manually update package.json version - the publish script handles this

## Changelog Format

Follow the structure in CHANGELOG.md:

```markdown
## [Unreleased]

## [X.Y.Z] - YYYY-MM-DD

### Added

- New features

### Changed

- Changes to existing functionality

### Fixed

- Bug fixes

### Documentation

- Documentation updates
```

## Version Numbering (Semantic Versioning)

- **Major (X.0.0)**: Breaking changes
- **Minor (0.X.0)**: New features, backwards compatible
- **Patch (0.0.X)**: Bug fixes, backwards compatible

## Writing Changelog Entries

### Be Specific

- Describe what changed, not how it was implemented
- Include method names, parameters, and examples
- Show before/after for breaking changes

### Use Action Words

- Added, Changed, Fixed, Removed, Deprecated
- Start with the category, then the description

### Include Examples

```markdown
### Added

- **Static Update Method**: Update documents by ID without loading
  - `Model.update(id, data)` - Update document directly by ID
  - Example: `await User.update('user123', { name: 'New Name' })`
```

### Document Breaking Changes Clearly

```markdown
### Breaking Changes

- **REMOVED**: `User.findModel(id)` → Use `User.load(id)` instead
- **BREAKING**: `paginate()` now uses named parameters
  - Before: `paginate(20, 1)`
  - After: `paginate({ perPage: 20, page: 1 })`
```

## What NOT to Do

- ❌ **DO NOT** create separate summary files (like CHANGES.md, SUMMARY.md)
- ❌ **DO NOT** manually update package.json version
- ❌ **DO NOT** skip the changelog - every release needs entries
- ❌ **DO NOT** use vague descriptions like "improved performance" without specifics

## Publishing Process

1. Update CHANGELOG.md with new version section
2. Run `./publish.sh` - this script:
   - Automatically updates package.json version
   - Builds the project
   - Runs tests
   - Publishes to npm
3. The version in package.json is managed by the publish script

## Unreleased Section

- Keep an `[Unreleased]` section at the top
- Add changes here during development
- Move to versioned section when publishing
- This helps track what's coming in the next release
