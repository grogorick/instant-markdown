# Instant Markdown
A minimal WYSIWYG-style markdown editor with **in-place editing** instead of the typical toggle or side-by-side preview.

Give it a try at https://markdown.grogorick.de

## Features
Aims to comply with [GitHub Flavored Markdown](https://github.github.com/gfm).  
Supports to be installed as web app (PWA) to look and feel almost like a native editor app.

### Paragraph formatting
- Headings (6 levels)  
`# title`  
`## title`  
...
`###### title`
- Bullet point lists  
`* list item`  
`- list item`  
`+ list item`
- Quotes  
`> quoted text`
- Code sections  
` ``` code ``` ` or `~~~ code ~~~`
- Horizontal rule  
`***` or `---` or `___`

### Inline formatting
- **Bold** or __bold__
- *Italic* or _italic_
- ~~Strikethrough~~
- `Inline code`
- [Links](https://github.com/grogorick/instant-markdown)
- ![Images](https://raw.githubusercontent.com/grogorick/instant-markdown/master/favicon.png)
- \`Escaped \*formatting \#characters

### Customization
Access to pre-defined CSS variables (via *Esc* key) to readily adjust the rendering style.

### File access
- Ctrl+O or drag 'n drop to open a file
- Ctrl+S to save the file

### Known issues and missing features:
- Click to move cursor to that exact position
- Text selection
- Multiline inline formatting
- Task lists
- Collapse sections
- Register PWA in OS to open \*.md files

*Pull requests are welcome!*
