## (An Incomplete) Prettier Plugin for Marko

[![CI](https://github.com/AngusMorton/prettier-plugin-marko-htmljs/actions/workflows/ci.yml/badge.svg)](https://github.com/AngusMorton/prettier-plugin-marko-htmljs/actions/workflows/ci.yml)

This is a prettier plugin for Marko that uses the htmljs parser instead of the `@marko/compiler` to parse the AST.

## Installation

This plugin isn't built into the Marko VSCode plugin, so you'll need to install and configure it separately to use it.

```console
npm install --save-dev prettier-plugin-marko-htmljs
```

Then configure prettier using a `.prettierrc` configuration file:

```json
{
  "plugins": ["prettier-plugin-marko-htmljs"]
}
```

#### VSCode Usage

In your `.vscode/settings.json` configuration, you'll need to configure the Prettier VSCode plugin to use `prettier-plugin-marko-htmljs` instead of the Marko plugin.

```json
{
  "[marko]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

#### CLI Usage

```console
npx prettier --write . "**/*.marko"
```

### Differences with prettier-plugin-marko

This plugin aims to follow Prettier's rules for formatting HTML where possible, for example:

#### Empty lines follow Prettier's rules

This is arguably a bug in `prettier-plugin-marko`. In this plugin, empty lines are collapsed into a single line in the same way as the HTML plugin. Similarly, whitespace between top-level static elements follows the same rules.

See: https://prettier.io/docs/en/rationale.html#empty-lines

```marko
<div class="parent">

    <div>The newlines at the start and end of parent's body will be removed.</div>

    <div>But newlines between will be preserved.</div>

<div>
```

Becomes:

```marko
<div class="parent">
    <div>The newlines at the start and end of parent's body will be removed.</div>

    <div>But newlines between will be preserved.</div>
<div>
```

#### Non-void tags have a separate close tag

**Why? Compatibility with Prettier's HTML formatting.**

```marko
<div/>
```

Becomes:

```marko
<div></div>
```

#### Support for bracketSameLine

prettier-plugin-htmljs will respect your `bracketSameLine` configuration to control the position of the end brackets.

```marko
// bracketSameLine: false (default)
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
  data-testid="this should be multi-line"
/>

// bracketSameLine: true
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
  data-testid="this should be multi-line" />
```

#### prettier-ignore support

You can use `prettier-ignore` comments to prevent formatting of specific elements or code blocks:

```marko
<!-- prettier-ignore -->
<div    class="keep-this-formatting"   >
    <span  >This won't be reformatted</span>
</div>

<div>
  <!-- prettier-ignore -->
  <span    class="also-ignored"   >This preserves original formatting</span>
  <span>But this will be formatted normally</span>
</div>
```

The plugin supports prettier-ignore for both top-level elements and nested children, preserving the original source exactly as written.

#### No concise mode support

Marko code written in "concise mode" is entirely untested and unsupported, it might work, but it might not.

## Development

This project uses `pnpm` for package management. To set up the development environment:

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build the plugin
pnpm build

# Format code
pnpm format

# Type check
pnpm tsc --noEmit
```

## Known Issues

- Preserve `<pre>` tags content.
