let match13 = { l: 1, r: 3 };
let formats = {
    line: {
        default:{ multiline: true },
        h1:     { pattern: /^(\s{0,3}#(\s|$))(.*$)/, match: match13, classes: ['heading'] },
        h2:     { pattern: /^(\s{0,3}##(\s|$))(.*$)/, match: match13, classes: ['heading'] },
        h3:     { pattern: /^(\s{0,3}###(\s|$))(.*$)/, match: match13, classes: ['heading'] },
        h4:     { pattern: /^(\s{0,3}####(\s|$))(.*$)/, match: match13, classes: ['heading'] },
        h5:     { pattern: /^(\s{0,3}#####(\s|$))(.*$)/, match: match13, classes: ['heading'] },
        h6:     { pattern: /^(\s{0,3}######(\s|$))(.*$)/, match: match13, classes: ['heading'] },
        quote:  { pattern: /^(\s{0,3}>)($|\s*.*$)/, multiline: true, outerTag: 'div' },
        code:   { pattern: /^(\s{0,3}(`{3,}|~{3,}))($|\s*.*$)/, match: match13, outerTag: 'code' },
        ul:     { pattern: /^((-|\+|\*)(\s|$))(.*$)/, match: { l: 1, r: 4 }, multiline: true, listItem: true, outerTag: 'ul', innerTag: 'li', classes: ['list'] },
        ol:     { pattern: /^(\d+(\.|\))(\s|$))(.*$)/, match: { l: 1, r: 4 }, multiline: true, listItem: true, outerTag: 'ol', innerTag: 'li', classes: ['list'] },
        hr:     { pattern: /^(\s*((\*\s*){3,}|(-\s*){3,}|(_\s*){3,}))()$/, match: { l: 1, r: 6 }, innerTag: 'div' }
    },
    inline: {
        code: [
            { pattern: /((^|[^`\\])`)([^`]|$)/, toggle: true }],
        math: [
            { pattern: /((^|\s)(\$))\S/, start: true },
            { pattern: /(\S\$)\S/, toggle: true },
            { pattern: /(\S(\$))(\s|$)/, end: true }],
        bold: [
            { pattern: /((^|\s)(\*\*|__))\S/, start: true, count: 2 },
            { pattern: /(\S(\*\*|__))\S/, toggle: true, count: 2 },
            { pattern: /(\S(\*\*|__))(\s|$)/, end: true, count: 2 }],
        italic: [
            { pattern: /((^|\s)(\*|_))\S/, start: true },
            { pattern: /(\S\*)\S/, toggle: true },
            { pattern: /(\S(\*|_))(\s|$)/, end: true }],
        strike: [
            { pattern: /((^|\s)~~)\S/, start: true, count: 2 },
            { pattern: /(\S~~)\S/, toggle: true, count: 2 },
            { pattern: /(\S~~)(\s|$)/, end: true, count: 2 }]
        },
    link: {
        explicit:
            { pattern: /\[(.*)\]\((.*)\)/, match: { text: 1, url: 2 }},
        implicit:
            { pattern: /(^|[\s\\|/([{])(https?:\/\/[^\s\\|)\]}]+)([\s\\|)\]}]|$)/, match: { before: 1, url: 2, after: 3 }}},
    img:
        { pattern: /\!\[(.*)\]\((.*)\)/, match: { text: 1, url: 2 }}
};

for (let f in formats.line) {
    formats.line[f] = Object.assign({ match: { l: 1, r: 2 }, classes: [], innerTag: 'p' }, formats.line[f]);
    formats.line[f].className = f;
    formats.line[f].classes.push(f);
}
for (let f in formats.inline) {
    for (let p in formats.inline[f])
        formats.inline[f][p] = Object.assign({ splitAfter: 1, count: 1 }, formats.inline[f][p]);
}

let lineFormats_all = Object.values(formats.line);
let lineFormats_singleline = lineFormats_all.filter(f => !f.multiline);
let lineFormats_listItem = lineFormats_all.filter(f => f.listItem);

let inlineFormats = [];
for (let f in formats.inline) {
    for (let format of formats.inline[f]) {
        format.className = f;
        inlineFormats.push(format);
    }
}

function setupMarkdown()
{
    input.addEventListener('input', e =>
    {
        fileChanged = !!input.value.length;
        updateMarkdown();
        updateSelection(e);
    });

    ['keyup', 'focus'].forEach(evtName => input.addEventListener(evtName, updateSelection));
    document.addEventListener('selectionchange', updateSelection);

    startInfo.addEventListener('click', e => input.focus());
    display.addEventListener('click', e => {
        setSelection(input.value.length);
        input.focus();
    });
    input.focus();
}

function updateMarkdown()
{
    display.innerHTML = '';

    if (input.value.length)
        startInfo.classList.add('hidden');
    else {
        startInfo.classList.remove('hidden');
        return;
    }

    sections = [];
    let position = 0;
    let newSection = values => Object.assign({ pos: position, blankLinesPos: position, format: formats.line.default, content: [], blankLines: [] }, values);
    let lines = input.value.split('\n');

    // parse input text to get sections with line formats
    let startNewSection = true;
    lines.forEach(lineText =>
    {
        let prevSection = sections.length ? sections.last() : null;
        let prevFormat = prevSection?.format;

        let nextPosition = position + 1 + lineText.length;
        let prepareLine = () => ({
            pos: position,
            text: lineText,
            left: { pos: position, text: '' },
            right: { pos: position, text: lineText }
        });
        let line = prepareLine();
        let lineFormatMatch = getLineFormat(line.text);
        line.left.text = lineFormatMatch.match.l;
        line.right.text = lineFormatMatch.match.r;
        line.right.pos += line.left.text.length;

        // code section
        let prevIsCode = prevFormat && prevFormat === formats.line.code;
        let isMatchingCodeEnd = () =>
            (!lineFormatMatch.match.r.trim().length) &&
            (line.text.trim().startsWith(sections.last().content[0][0].left.text.trim()));

        if (lineFormatMatch.format === formats.line.code && (!prevIsCode || isMatchingCodeEnd())) {
            if (!prevIsCode)
                sections.push(newSection({ format: lineFormatMatch.format, content: [[line]], blankLinesPos: nextPosition }));
            else {
                prevSection.content.push([line]);
                prevSection.finished = true;
                startNewSection = true;
                prevSection.blankLinesPos = nextPosition;
            }
        }
        else if (prevIsCode && !prevSection.finished) {
            prevSection.content.push([prepareLine()]);
            prevSection.blankLinesPos = nextPosition;
        }

        // empty line
        else if (line.text.trim() === '') {
            if (!sections.length)
                sections.push(newSection({ blankLines: [line] }));
            else
                sections.last().blankLines.push(line);
            startNewSection = true;
        }
        else {
            // formatted
            if (lineFormatMatch.format !== formats.line.default) {
                let sameAsPrevious = prevFormat && prevFormat === lineFormatMatch.format && !prevSection.blankLines.length;
                if (lineFormatMatch.format.listItem && sameAsPrevious) {
                    prevSection.content.push([line]);
                    startNewSection = false;
                }
                else if (lineFormatMatch.format.multiline && sameAsPrevious) {
                    prevSection.content.push([line]);
                    startNewSection = false;
                }
                else {
                    sections.push(newSection({ format: lineFormatMatch.format, content: [[line]] }));
                    startNewSection = lineFormats_singleline.includes(lineFormatMatch.format);
                }
            }
            // plain text
            else {
                if (prevFormat?.listItem && !prevSection.blankLines.length)
                    prevSection.content.last().push(line);
                else if (startNewSection)
                    sections.push(newSection({ content: [[line]] }));
                else
                    sections.last().content.push([line]);
                startNewSection = false;
            }
            sections.last().blankLinesPos = nextPosition;
        }
        position = nextPosition;
    });

    // generate HTML
    let headingLevel = {
        list: [display, null, null, null, null, null, null],
        current: 0,
        set: (level, el, hl = headingLevel) =>
        {
            hl.list[hl.current = level] = el;
            for (let i = level + 1; i < hl.list.length; ++i)
                hl.list[i] = null;
            return el;
        },
        getParent: (level, hll = headingLevel.list) =>
        {
            for (let i = level - 1; i >= 0; --i)
                if (hll[i])
                    return hll[i];
        },
        get: (level = headingLevel.current) => headingLevel.list[level]
    };
    sections.forEach(section =>
    {
        let format = section.format;
        section.htmlTag = document.createElement('div');
        format.classes.forEach(className => section.htmlTag.classList.add(className));

        if (section.content.length) {
            let container = section.htmlTag;
            if (format.outerTag) {
                container = document.createElement(format.outerTag);
                section.htmlTag.appendChild(container);
            }
            for (let c in section.content) {
                let lines = section.content[c];
                let tag = document.createElement(format.innerTag);
                for (let l in lines) {
                    let line = lines[l];
                    let lineDiv = document.createElement('div');
                    lineDiv.classList.add('line');

                    let spanLeft = document.createElement('span');
                    spanLeft.classList.add('left');
                    spanLeft.innerHTML = line.left.text;
                    lineDiv.appendChild(spanLeft);
                    line.left.htmlTag = spanLeft;
                    setupClick(line.left);

                    line.right.parts = [];
                    if (format == formats.line.code) {
                        line.right.parts.push({ text: line.right.text, pos: line.right.pos, classList: [] });
                    }
                    else {
                        let classList = new Set();
                        for (let part1 of detectSpecialTags(line.right.text, line.right.pos, classList)) {
                            if (!part1.text || part1.classList.includes('fmt'))
                                line.right.parts.push(part1);
                            else {
                                for (let part2 of detectInlineFormats(part1.text, part1.pos, new Set(part1.classList))) {
                                    part2.tag = Object.assign(part1.tag || {}, part2.tag || {});
                                    line.right.parts.push(part2);
                                }
                            }
                        }
                    }
                    let spanRight = document.createElement('span');
                    spanRight.classList.add('right');
                    for (let part of line.right.parts) {
                        let spanPart = document.createElement(part.tag?.type ?? 'span');
                        spanPart.className = part.classList.join(' ');
                        if (part.text)
                            spanPart.innerHTML = part.text;
                        if (part.tag?.attrs) {
                            for (let [attr, value] of Object.entries(part.tag.attrs))
                                spanPart[attr] = value;
                        }
                        spanRight.appendChild(spanPart);
                        part.htmlTag = spanPart;
                        setupClick(part);

                        if (part.classList.includes(formats.inline.math[0].className)) {
                            let spanPart = document.createElement('span');
                            spanPart.className = 'math-render';
                            if (part.text) {
                                try {
                                    katex.render(part.text, spanPart);
                                } catch(err) {
                                    spanPart.innerHTML = ' <i>(math syntax invalid)</i>';
                                }
                            }
                            spanRight.appendChild(spanPart);
                            renderPart = Object.assign({}, part, { htmlTag: spanPart });
                            setupClick(renderPart);
                        }
                    }
                    lineDiv.appendChild(spanRight);
                    line.right.htmlTag = spanRight;
                    line.right.htmlTag.priorityClick = e => {};
                    line.right.htmlTag.addEventListener('click', e => line.right.htmlTag.priorityClick(e));
                    setupClick(line.right);

                    tag.appendChild(lineDiv);
                    line.htmlTag = lineDiv;
                    setupClick(line);
                }
                container.appendChild(tag);
                section.content[c] = { lines: lines, htmlTag: tag, pos: lines[0].pos };
            }
        }
        if (section.blankLines.length) {
            for (let c in section.blankLines) {
                let line = section.blankLines[c];
                let tag = document.createElement(formats.line.default.innerTag);
                let lineDiv = document.createElement('div');
                lineDiv.classList.add('line');
                    let spanLeft = document.createElement('span');
                    spanLeft.classList.add('left');
                    lineDiv.appendChild(spanLeft);
                    line.left.htmlTag = spanLeft;

                    let spanRight = document.createElement('span');
                    spanRight.classList.add('right');
                    spanRight.innerHTML = line.text;
                    lineDiv.appendChild(spanRight);
                    line.right.htmlTag = spanRight;
                tag.appendChild(lineDiv);
                line.htmlTag = lineDiv;
                section.htmlTag.appendChild(tag);
                section.blankLines[c] = { lines: [line], htmlTag: tag, pos: line.pos, text: line.text };
                setupClick(section.blankLines[c]);
            }
        }

        // collapsable heading hierarchy
        if (format.classes.includes('heading')) {
            let level = parseInt(format.className.substr(1));
            let parent = headingLevel.getParent(level);
            parent.appendChild(section.htmlTag);
            let levelDiv = headingLevel.set(level, document.createElement('div'));
            parent.appendChild(levelDiv);
            section.content[0].lines[0].right.htmlTag.priorityClick = e => levelDiv.classList.toggle('hidden');
        }
        else
            headingLevel.get().appendChild(section.htmlTag);
    });
}

function setupClick(el)
{
    el.htmlTag.addEventListener('click', e =>
    {
        e.stopPropagation();
        setSelection(el.pos + el.text.length);
        input.focus();
    });
}

function getLineFormat(line, formatsToCheck = null)
{
    let formatsArray = formatsToCheck || lineFormats_all;
    for (let i in formatsArray) {
        let format = formatsArray[i];
        if (!format.inline && format.pattern) {
            let allMatches = line.match(format.pattern);
            if (allMatches) {
                let matches = {};
                for (let m in format.match)
                    matches[m] = allMatches[format.match[m]];
                return { format: format, match: matches };
            }
        }
    }
    return formatsToCheck ? null : { format: formats.line.default, match: { l: '', r: line } };
}

function detectInlineFormats(text, position, classList = new Set())
{
    let parts = [];
    while (true) {
        let next = null;
        for (let format of inlineFormats) {
            if ((format.className !== formats.inline.code[0].className && classList.has(formats.inline.code[0].className)) ||
                (format.className !== formats.inline.math[0].className && classList.has(formats.inline.math[0].className))) {
                continue;
            }
            let tmp = text.match(format.pattern);
            if (tmp && (!next || (tmp.index < next.match.index) || (tmp.index === next.match.index && format.count > next.count)))
                next = { match: tmp, format: format };
        }
        if (!next)
            break;
        let splitPos = next.match.index + next.match[next.format.splitAfter].length;
        let part = text.substr(0, splitPos - next.format.count);
        if (part.length && part.slice(-1) === `\\`) {
            if (part.length > 1) {
                parts.push({ text: part.slice(0, -1), pos: position, classList: [...classList.values()] });
                position += part.length - 1;
            }
            parts.push({ text: '\\', pos: position, classList: ['fmt'] });
            position += 1;

            part = text.substr(splitPos - next.format.count, next.format.count);
            parts.push({ text: part, pos: position, classList: [...classList.values()] });
            position += next.format.count;

            text = text.substr(splitPos);
            continue;
        }
        parts.push({ text: part, pos: position, classList: [...classList.values()] });
        position += part.length;

        part = text.substr(splitPos - next.format.count, next.format.count);
        parts.push({ text: part, pos: position, classList: ['fmt'] });
        position += next.format.count;

        text = text.substr(splitPos);
        if (next.format.start || (next.format.toggle && !classList.has(next.format.className)))
            classList.add(next.format.className);
        else if (next.format.end || (next.format.toggle && classList.has(next.format.className)))
            classList.delete(next.format.className);
    }
    if (text.length)
        parts.push({ text: text, pos: position, classList: [...classList.values()] });
    return parts;
}

function detectSpecialTags(text, position, classList = new Set())
{
    let parts = [];
    let updatePos = () => position = parts.last().pos + (parts.last().text?.length ?? 0);
    while (true) {
        let linkExplicit = { m: text.match(formats.link.explicit.pattern), f: formats.link.explicit };
        let linkImplicit = { m: text.match(formats.link.implicit.pattern), f: formats.link.implicit };
        let img = { m: text.match(formats.img.pattern), f: formats.img };
        let match = [linkExplicit, linkImplicit].reduce((a, b) => (a.m && b.m) ? ((a.m.index < b.m.index) ? a : b) : (a.m ? a : b), img);
        if (match.m) {
            let linkURL = match.m[match.f.match.url];
            if (match === linkExplicit) {
                let linkText = match.m[match.f.match.text];
                parts.push({ text: text.substr(0, match.m.index), pos: position, classList: [...classList.values()] }); updatePos();
                parts.push({ text: '[', pos: position, classList: ['fmt'] }); updatePos();
                for (let part of detectInlineFormats(linkText, position, classList)) {
                    part.tag = { type: 'a', attrs: { href: linkURL, target: '_blank' }};
                    part.classList.push('link');
                    parts.push(part);
                }
                updatePos();
                parts.push({ text: '](' + linkURL + ')', pos: position, classList: ['fmt'] }); updatePos();
                text = text.substr(match.m.index + match.m[0].length);
            }
            else if (match === linkImplicit) {
                parts.push({ text: text.substr(0, match.m.index) + match.m[match.f.match.before], pos: position, classList: [...classList.values()] }); updatePos();
                parts.push({ text: linkURL, pos: position, classList: [...classList.values(), 'link'], tag: { type: 'a', attrs: { href: linkURL, target: '_blank' }}}); updatePos();
                text = text.substr(match.m.index + match.m[0].length - match.m[match.f.match.after].length);
            }
            else if (match === img) {
                let linkText = match.m[match.f.match.text];
                parts.push({ text: text.substr(0, match.m.index), pos: position, classList: [...classList.values()] }); updatePos();
                parts.push({ single: true, pos: position, classList: ['img'], tag: { type: 'img', attrs: { src: linkURL, alt: linkText }}}); updatePos();
                parts.push({ text: '![' + linkText + '](' + linkURL + ')', pos: position, classList: ['fmt'] }); updatePos();
                text = text.substr(match.m.index + match.m[0].length);
            }
        }
        else
            break;
    }
    if (text.length) {
        parts.push({ text: text, pos: position, classList: [...classList.values()] });
        if (text.endsWith('  ')) {
            parts.last().text = text.slice(0, -2);
            parts.push({ text: ' &#x21a9;', pos: position + text.length - 2, classList: ['fmt', 'eol-spaces'] });
        }
    }
    return parts;
}

function updateSelection(evt)
{
    if (evt)
        evt.stopPropagation();

    if (input !== document.activeElement || !input.value.length)
        return;

    let selectionStartChanged = input.selectionStart !== (selectionStart.pos ?? -1);
    let selectionEndChanged = input.selectionEnd !== (selectionEnd.pos ?? -1);
    if (!(selectionStartChanged || selectionEndChanged))
        return;

    document.querySelectorAll('#display .selection').forEach(el => el.classList.remove('selection'));
    document.querySelectorAll('#display .current').forEach(el => el.classList.remove('current'));
    display.querySelectorAll('.cursor').forEach(el => el.remove());

    selectionStart = trackSelection(input.selectionStart);
    selectionEnd = trackSelection(input.selectionEnd);


    // selection
    let tmpItems = [];
    for (let i = sections.indexOf(selectionStart.el.section), end = sections.indexOf(selectionEnd.el.section); i <= end; ++i) {
        let section = sections[i];
        section.htmlTag.classList.add('selection');

        [section.content, section.blankLines].forEach(items => items.forEach(item => tmpItems.push(item)));
    }
    let tmpLines = [];
    for (let i = tmpItems.indexOf(selectionStart.el.item), end = tmpItems.indexOf(selectionEnd.el.item); i <= end; ++i) {
        let item = tmpItems[i];
        item.htmlTag.classList.add('selection');

        item.lines.forEach(line => tmpLines.push(line));
    }
    let tmpParts = [];
    for (let i = tmpLines.indexOf(selectionStart.el.line), end = tmpLines.indexOf(selectionEnd.el.line); i <= end; ++i) {
        let line = tmpLines[i];
        line.htmlTag.classList.add('selection');

        if (line.left.text)
            tmpParts.push(line.left);
        if (line.right.parts?.length)
            line.right.parts.forEach(part => tmpParts.push(part));
        else
            tmpParts.push(line.right);
    }
    let partOrFormatStart = selectionStart.el.inlinePart ?? selectionStart.el.format;
    let partOrFormatEnd = selectionEnd.el.inlinePart ?? selectionEnd.el.format;
    let iStart = tmpParts.indexOf(partOrFormatStart); if (iStart === -1) iStart = 0;
    let iEnd = tmpParts.indexOf(partOrFormatEnd); if (iEnd === -1) iEnd = tmpParts.length - 1;
    for (let i = iStart, end = iEnd; i <= end; ++i) {
        tmpParts[i].htmlTag.classList.add('selection');
    }


    // cursor
    let selection = input.selectionDirection === 'forward' ? selectionEnd : selectionStart;
    Object.values(selection.el).forEach(el => el.htmlTag.classList.add('current'));

    let cursorParent = selection.el.format || selection.el.inlinePart || selection.el.line.right || selection.el.item;
    if (cursorParent.single) {
        let i = document.createElement('i');
        i.classList.add('cursor');
        cursorParent.htmlTag.parentNode.insertBefore(i, cursorParent.htmlTag);
    }
    else {
        let ih = decodeHtml(cursorParent.htmlTag.innerHTML);
        cursorParent.htmlTag.innerHTML =
            ih.substr(0, selection.pos - cursorParent.pos) +
            '<i class="cursor"></i>' +
            ih.substr(selection.pos - cursorParent.pos);
    }

    // scroll to cursor if reqired
    let displayBox = display.getBoundingClientRect();
    let cursorBox = cursorParent.htmlTag.getBoundingClientRect();
    if (cursorBox.top < scrollMargin)
        window.scrollTo(0, cursorBox.top - displayBox.top - scrollMargin);
    else if (cursorBox.bottom > window.innerHeight - scrollMargin)
        window.scrollTo(0, cursorBox.bottom - window.innerHeight - displayBox.top + scrollMargin, true);
}

function setSelection(cursorStartPos, cursorEndPos = null)
{
    input.selectionStart = cursorStartPos;
    input.selectionEnd = cursorEndPos ?? cursorStartPos;
}

function trackSelection(cursorPos)
{
    let selection = {};

    // section
    for (let s in sections) {
        let section = sections[s];
        if (section.pos > cursorPos) {
            selection.section = sections[s - 1];
            break;
        }
    }
    if (!selection.section)
        selection.section = sections.last();

    // item or blank line
    let itemList = (selection.section.blankLinesPos > cursorPos) ? selection.section.content : selection.section.blankLines;
    for (let i in itemList) {
        let item = itemList[i];
        if (item.pos > cursorPos) {
            selection.item = itemList[i - 1];
            break;
        }
    }
    if (!selection.item)
        selection.item = itemList.last();

    // line
    for (let l in selection.item.lines) {
        let line = selection.item.lines[l];
        if (line.pos > cursorPos) {
            selection.line = selection.item.lines[l - 1];
            break;
        }
    }
    if (!selection.line)
        selection.line = selection.item.lines.last();

    // format
    if (selection.line.right.pos > cursorPos ||
            (selection.line.right.pos == cursorPos &&
             selection.line.left.text.length &&
             !selection.line.right.text.length &&
             !selection.line.left.text.endsWith(' '))) {
        selection.format = selection.line.left;
    }

    // inline part
    else if (selection.line.right.parts?.length) {
        for (let p in selection.line.right.parts) {
            let part = selection.line.right.parts[p];
            if (part.pos === cursorPos) {
                selection.inlinePart = part;
                break;
            }
            if (part.pos > cursorPos) {
                selection.inlinePart = selection.line.right.parts[p - 1];
                break;
            }
        }
        if (!selection.inlinePart)
            selection.inlinePart = selection.line.right.parts.last();
    }

    return { pos: cursorPos, el: selection };
}