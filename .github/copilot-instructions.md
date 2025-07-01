# Prettier Plugin for Marko (HtmlJS) - Copilot Instructions

## Overview

This is a Prettier plugin for formatting Marko files using the htmljs-parser instead of the @marko/compiler. It aims to follow Prettier's HTML formatting rules where possible.

## Project Structure

### Core Modules

- **`src/index.ts`** - Main plugin entry point, exports language definitions and parsers
- **`src/parser/`** - Parses Marko files using htmljs-parser into an AST
  - `parser.ts` - Main parser logic (729 lines)
  - `MarkoNode.ts` - TypeScript types for AST nodes
- **`src/printer/`** - Converts AST back to formatted code
  - `index.ts` - Main print function
  - `tag/` - Tag-specific printing logic
  - `comment/` - Comment printing logic
- **`src/embed/`** - Handles embedded code (TypeScript, JavaScript, CSS)
  - `index.ts` - Main embed logic
  - `internal/` - Specific embed handlers for different node types
- **`src/util/`** - Utility functions for text processing

### Build System

- **TypeScript** compilation with declaration files
- **Rollup** bundling for ESM and browser builds
- **Target**: ES2019, ES2020 modules
- **Outputs**: `dist/plugin.mjs` (main), `dist/browser.js` (browser)

## Commands

### Development

```bash
pnpm build           # Full build (TypeScript + Rollup)
pnpm dev             # Watch mode development
pnpm format          # Format codebase with Prettier
```

### Testing

Never try to filter for specific tests files, always run all tests to ensure consistency.

```bash
pnpm test            # Run tests
pnpm test:watch      # Run tests in watch mode
```

### Dependencies

- **Runtime**: `htmljs-parser ^5`, `prettier ^3`
- **Dev**: TypeScript, Rollup, Vitest, Babel types

## Test System

### Test Structure

- **Framework**: Vitest
- **Location**: `test/fixtures/` with category subdirectories
- **Pattern**: Each `.marko` file has corresponding snapshots in `__snapshots__/`

### Test Categories

- `attr-tag/` - Attribute tag formatting
- `attributes/` - Various attribute types and expressions
- `class/` - Class attribute handling
- `comments/` - Comment preservation and formatting
- `control-flow/` - Marko control flow constructs
- `export/` - Export statements
- `html/` - HTML element formatting
- `import/` - Import statements
- `typescript/` - TypeScript-specific features
- `whitespace/` - Whitespace handling rules

### Test Process

1. **Snapshot Testing**: Each fixture is formatted and compared against stored snapshots
2. **Multiple Configurations**: Tests run with different Prettier options
3. **Idempotency Check**: Ensures formatting is stable (formatting twice produces same result)
4. **Parse Validation**: Verifies formatted output can be re-parsed

### Running Specific Tests

```bash
# Run tests for specific category
pnpm test test/fixtures/attributes/

# Update snapshots
pnpm test -u
```

## Key Features

### Formatting Rules

- Follows Prettier's HTML whitespace collapsing rules
- Non-void tags always have separate close tags (`<div></div>` not `<div/>`)
- Respects `bracketSameLine` configuration
- Preserves meaningful empty lines between elements

### Embed Support

- TypeScript/JavaScript expressions in attributes and tag bodies
- CSS in `<style>` tags
- Proper parenthesis handling for complex expressions

### Marko-Specific Features

- Attribute tags (`<div.class-name>`)
- Shorthand attributes (`<div.foo>` for class, `<div#bar>` for id)
- Control flow tags (`<if>`, `<for>`, etc.)
- Component parameters and arguments
- Script and style tag handling

## Common Debugging

### Parser Issues

- Check `src/parser/parser.ts` for AST node creation
- Verify htmljs-parser compatibility
- Add debug logging in parser for new node types

### Formatting Issues

- Check `src/printer/index.ts` and `src/printer/tag/tag.ts`
- Test with minimal reproduction in `test/fixtures/`
- Use Prettier's doc builders: `hardline`, `softline`, `group`, `fill`

### Embed Issues

- Check `src/embed/` for expression handling
- Verify parenthesis logic in `needsParenthesis.ts`
- Test JavaScript/TypeScript expression formatting

## Plugin Architecture

This is a standard Prettier plugin that exports:

- `languages` - Defines "marko" language support
- `parsers` - Maps to the htmljs-based parser
- `printers` - Maps to the custom printer
- `options` - Plugin-specific formatting options

The plugin integrates with Prettier's ecosystem and can be used via CLI, API, or editor extensions.

## Prettier-Ignore Implementation

### Overview

The plugin supports `prettier-ignore` directives for both top-level and nested nodes, preserving original source exactly as written without any reformatting.

### Core Files

- **`src/util/prettierIgnore.ts`** - Detection and source extraction utilities
- **`src/printer/index.ts`** - Top-level ignore handling in `printProgram()`
- **`src/printer/tag/tag.ts`** - Nested ignore handling in `printChildren()`

### Detection Logic

```typescript
// In src/util/prettierIgnore.ts
isPrettierIgnoreComment(node: Comment) -> boolean
// Checks for "prettier-ignore" in HTML, line, or block comments

getOriginalSource(node: AnyNode, originalText: string) -> string
// Extracts exact original source text for a node using start/end positions
```

### Top-Level Ignore (src/printer/index.ts)

- **Location**: `printProgram()` function
- **Logic**: Detects ignore comments in program body, skips formatting next non-comment node
- **Preservation**: Uses original source directly in doc output
- **Handles**: Root-level tags, imports, exports, scriptlets

### Nested Ignore (src/printer/tag/tag.ts)

- **Location**: `printChildren()` function
- **Logic**:
  1. Detects ignore comments among tag children
  2. Finds next non-comment child to ignore
  3. Preserves whitespace between comment and ignored content
  4. Reconstructs content using `literalline` for multi-line preservation
- **Handles**: Child elements, text nodes, mixed content

### Key Implementation Details

- **Whitespace Preservation**: Includes whitespace nodes between ignore comment and target
- **Multi-line Handling**: Uses `literalline` to prevent indentation drift
- **Idempotency**: Careful doc construction prevents formatting changes on subsequent passes
- **Source Extraction**: Uses AST node positions to extract exact original text

### Test Coverage

- `test/fixtures/comments/prettier-ignore.marko` - Basic functionality
- `test/fixtures/comments/prettier-ignore-complex.marko` - Multi-line structures
- `test/fixtures/comments/prettier-ignore-nested.marko` - Nested children
- All variants tested: no-opts, html-sensitivity, bracket-same-line

### Debugging Ignore Issues

1. Check `isPrettierIgnoreComment()` detection logic
2. Verify `getOriginalSource()` extracts correct text
3. Test idempotency with format-twice comparisons
4. Examine whitespace handling in `printChildren()`
5. Use minimal reproduction in test fixtures
