import { Options } from "prettier";
import { AnyNode } from "../parser/MarkoNode";

const CSS_DISPLAY_TAGS: Record<string, string> = {
  area: "none",
  base: "none",
  basefont: "none",
  datalist: "none",
  head: "none",
  link: "none",
  meta: "none",
  noembed: "none",
  noframes: "none",
  rp: "none",
  style: "none",
  title: "none",
  html: "block",
  body: "block",
  address: "block",
  blockquote: "block",
  center: "block",
  div: "block",
  figure: "block",
  figcaption: "block",
  footer: "block",
  form: "block",
  header: "block",
  hr: "block",
  legend: "block",
  listing: "block",
  main: "block",
  p: "block",
  plaintext: "block",
  pre: "block",
  xmp: "block",
  slot: "contents",
  ruby: "ruby",
  rt: "ruby-text",
  article: "block",
  aside: "block",
  h1: "block",
  h2: "block",
  h3: "block",
  h4: "block",
  h5: "block",
  h6: "block",
  hgroup: "block",
  nav: "block",
  section: "block",
  dir: "block",
  dd: "block",
  dl: "block",
  dt: "block",
  ol: "block",
  ul: "block",
  li: "list-item",
  table: "table",
  caption: "table-caption",
  colgroup: "table-column-group",
  col: "table-column",
  thead: "table-header-group",
  tbody: "table-row-group",
  tfoot: "table-footer-group",
  tr: "table-row",
  td: "table-cell",
  th: "table-cell",
  fieldset: "block",
  button: "inline-block",
  template: "inline",
  source: "block",
  track: "block",
  script: "block",
  param: "block",

  // noscript: "inline",

  // there's no css display for these elements but they behave these ways
  details: "block",
  summary: "block",
  dialog: "block",
  meter: "inline-block",
  progress: "inline-block",
  object: "inline-block",
  video: "inline-block",
  audio: "inline-block",
  select: "inline-block",
  option: "block",
  optgroup: "block",

  // Missing
  search: "block",

  // Marko built-in components
  if: "block",
  "if-else": "block",
  else: "block",
  for: "block",
};

const CSS_DISPLAY_DEFAULT = "inline";

// This function returns the default CSS display property for a given node
// which is used to determine how we should insert linebreaks for the tag.
// Generally, we only care if an element is "block" but we return the full
// class name just in case we want to alter the logic down the track.
export function cssStyleDisplay(node: AnyNode, options: Options): string {
  switch (options.htmlWhitespaceSensitivity) {
    case "strict":
      return "inline";
    case "ignore":
      return "block";
    default:
      const nodeDisplay =
        node.type === "Tag" && node.nameText && CSS_DISPLAY_TAGS[node.nameText];
      return nodeDisplay || CSS_DISPLAY_DEFAULT;
  }
}
