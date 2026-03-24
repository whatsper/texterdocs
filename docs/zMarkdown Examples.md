# Markdown Examples

This site uses **Docusaurus**, which turns `.md` / `.mdx` docs into pages with **[MDX](https://mdxjs.com/)**. You can use **standard Markdown**, **GitHub Flavored Markdown (GFM)** extras, and **Docusaurus-specific** syntax (admonitions, rich code blocks, and more).

Below is a practical cheat sheet. Anything labeled **GFM** or **Docusaurus** is an extension beyond basic Markdown.

---

## Headings

Use `#` through `######` for six levels. Leave a blank line after a heading for reliable parsing.

```md
# H1 — page title (one per page is typical)
## H2 — major section
### H3 — subsection
#### H4
##### H5
###### H6
```

---

## Paragraphs and line breaks

Separate paragraphs with a **blank line**.

End a line with **two spaces** before the newline, or use a **`<br />`**, to force a single line break inside a paragraph.

```md
First line with two trailing spaces  
Second line (same paragraph).

Or use an explicit break:<br />Next line.
```

---

## Emphasis

| You write | You get |
|-----------|---------|
| `**bold**` or `__bold__` | **bold** |
| `*italic*` or `_italic_` | *italic* |
| `***bold and italic***` | ***bold and italic*** |
| `` `inline code` `` | `inline code` |

**GFM — strikethrough:** `~~removed~~` → ~~removed~~

---

## Links and images

**Markdown link:** `[visible text](https://example.com)`

**Same site (absolute path):** `[YAML overview](/docs/YAML/Overview)`

**Relative path to another doc:** `[Bot configuration](./YAML/Bot%20Configuration)` (encode spaces as `%20` or use real spaces in some setups).

**Bare URL (GFM autolink):** `https://texterchat.com` → https://texterchat.com

**Image** (files under `static/` are served from the site root):

```md
![Texter logo](/img/texter_logo.png)
```

![Texter logo](/img/texter_logo.png)

---

## Blockquotes

```md
> A quoted line.
> > Nested quote.
```

> A quoted line.
> > Nested quote.

---

## Horizontal rules

On its own line, use three or more `-`, `*`, or `_` (can repeat for visibility):

```md
---
***
___
```

---

## Lists

**Unordered** — use `-`, `*`, or `+` (pick one style consistently in a list):

```md
- Item one
- Item two
  - Nested item
  - Another nested
```

**Ordered** — any number; the renderer usually normalizes:

```md
1. First
2. Second
   1. Sub-step A
   2. Sub-step B
```

**GFM — task lists:**

```md
- [x] Done
- [ ] Todo
```

- [x] Done
- [ ] Todo

---

## Fenced code blocks

Wrap with **three backticks**. Put an optional **language id** right after the opening fence for syntax highlighting (this site configures Prism; **`yaml`** is available for bot examples).

````md
```yaml
bot:
  welcome: "Hello"
```
````

```yaml
bot:
  welcome: "Hello"
```

**Docusaurus — code block title** (shows a label above the block):

````md
```yaml title="minimal-bot.yml"
start: welcome
```
````

```yaml title="minimal-bot.yml"
start: welcome
```

**Docusaurus — highlight specific lines** (line numbers are 1-based; ranges use `-`):

````md
```yaml {2,4-5}
a: 1
b: 2
c: 3
d: 4
e: 5
```
````

```yaml {2,4-5}
a: 1
b: 2
c: 3
d: 4
e: 5
```

**Docusaurus — line numbers** in the margin:

````md
```yaml showLineNumbers
one: 1
two: 2
```
````

```yaml showLineNumbers
one: 1
two: 2
```

You can combine options, e.g. `` ```yaml title="bot.yml" {1,3} showLineNumbers ``.

---

## Tables (GFM)

```md
| Column A | Column B | Column C |
|----------|:--------:|---------:|
| left     | center   | right    |
| text     | text     | `code`   |
```

| Column A | Column B | Column C |
|----------|:--------:|---------:|
| left     | center   | right    |
| text     | text     | `code`   |

- Hyphens `-` separate header cells; colons `:` control alignment (`:---`, `:---:`, `---:`).

---

## Admonitions (Docusaurus)

Fenced with `:::`, using a **type** and optional **title** on the first line.

Types you will see in this documentation include **`note`**, **`tip`**, **`info`**, **`warning`**, **`danger`**, and **`caution`** (availability can depend on theme; if a type does not render, use `note` or `tip` instead).

```md
:::note

Default admonition title for `note`.

:::

:::tip Optional title

Helpful hint text.

:::

:::info FYI

Neutral background information.

:::

:::warning

Something that can cause confusion or mistakes.

:::

:::danger

Risk of data loss or breaking production behavior.

:::

:::caution

Softer than danger; still read carefully.

:::
```

:::note

Default admonition title for `note`.

:::

:::tip Optional title

Helpful hint text.

:::

:::info FYI

Neutral background information.

:::

:::warning

Something that can cause confusion or mistakes.

:::

:::danger

Risk of data loss or breaking production behavior.

:::

:::caution

Softer than danger; still read carefully.

:::

---

## Footnotes (GFM)

```md
This sentence has a footnote.[^fn1]

[^fn1]: Footnote text can span lines and include [links](https://example.com).
```

This sentence has a footnote.[^fn1]

[^fn1]: Footnote text can span lines and include [links](https://example.com).

---

## Emoji (GFM / remark)

Shortcodes like `:smile:` may render as :smile: when emoji support is enabled (depends on the build).

---

## HTML in MDX

Because pages are **MDX**, you can embed **HTML** where needed, for example a collapsible block:

```html
<details>
<summary>Click to expand</summary>

Hidden content supports **Markdown** inside.

</details>
```

<details>
<summary>Click to expand</summary>

Hidden content supports **Markdown** inside.

</details>

**Caution:** In MDX, raw `{` and `}` in text can be interpreted as JSX. If something breaks, wrap those characters in backticks, use a fenced code block, or escape with HTML entities (e.g. `&#123;` for `{`).

---

## MDX and React (`.mdx` only)

`.mdx` files can **import** or **define** React components and embed them in prose. This page is `.md`, so it sticks to Markdown + HTML. For interactive examples, see the Docusaurus tutorial’s [Markdown features](https://docusaurus.io/docs/markdown-features) in their docs, or add a `.mdx` page under `src/pages` / `docs` if you need components.

---

## Compact cheat sheet

| Goal | Pattern |
|------|---------|
| Big title | `# Title` |
| Section | `## Section` |
| Subsection | `### Sub` |
| Separation line | `---` or `***` or `___` on its own line |
| Code block | Open with three backticks, optional language (e.g. `yaml`), close with three backticks |
| Bullet list | `- item` (indent for nesting) |
| Table | Pipe columns; dashed separator row under the header (see **Tables** above) |

| Name | Type | Info |
|------|------|------|
| Gil | Admin | Owner of Texter |
| Gal | Developer | Developer at Texter |
