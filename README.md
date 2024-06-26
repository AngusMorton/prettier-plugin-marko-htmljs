## (An Incomplete) Prettier Plugin for Marko

This is a prettier plugin for Marko that uses the htmljs parser instead of the `@marko/compiler` to parse the AST.

## Installation
This plugin isn't built into the Marko VSCode plugin, so you'll need to install and configure it separately to use it.

```console
npm install --save-dev prettier-plugin-marko-htmljs
```

Then configure prettier using a `.prettierrc` configuration file:

```json
{
  "plugins": ["prettier-plugin-marko-htmljs"],
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

#### No concise mode support

Marko code written in "concise mode" is entirely untested and unsupported, it might work, but it might not.

## Known Issues

- Preserve `<pre>` tags content.
- Style less/sass support. (style.less / style.sass / style.js / etc.)
- Prettier ignore directive support.
- Shorthand class names are not merged into the "class" attribute.
