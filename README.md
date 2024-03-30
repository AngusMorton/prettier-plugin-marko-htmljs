## (An Incomplete) Prettier Plugin for Marko

This is a prettier plugin for Marko that uses the htmljs parser instead of the `@marko/compiler` to parse the AST.

Some differences between this plugin and `prettier-plugin-marko` include:

### Empty lines follow Prettier's rules

This is arguably a bug in `prettier-plugin-marko`. In this plugin, empty lines are collapsed into a single line in the same way as the HTML plugin. Similarly whitespace between top-level static elements follow the same rules.

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

### Non-void tags have separate close tag

**Why? Compatibility with Prettier's HTML formatting.**

```marko
<div/>
```

Becomes:

```marko
<div></div>
```

### Support for bracketSameLine

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

### No concise mode support

Marko code written in concise mode will be rewritten as HTML tags (probably?). It's entirely untested and unsupported.

**Why? Code length isn't worth optimizing for and concise mode increase the barrier to entry for new devs. But also because I didn't want to implement it.**

## TODO:

- Preserve `<pre>` tags content.
- Style less/sass support. (style.less / style.sass / style.js / etc.)
- Prettier ignore directive support.
- Merge shorthand class names into "class" attribute.
