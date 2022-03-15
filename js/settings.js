function setupSettings()
{
    document.addEventListener('keydown', e =>
    {
        if (e.key.toLowerCase() === 'escape') {
            stopEvent(e);
            toggleSettings();
        }
    });
    customCSS = new CSSStyleSheet();
    document.adoptedStyleSheets = [customCSS];

    if (cookies.customStyle) {
        try {
            customStyle = JSON.parse(cookies.customStyle);
        } catch(e) {
            console.log('Unable to read custom style. Probably old version remaininges.', e);
        }
    }
    let list = settings.querySelector('#settings #list');
    let itemTempalate = list.querySelector('#settings #item-template');
    let style = document.styleSheets[0].cssRules[0].styleMap;
    for (let key of style.keys()) {
        let item = itemTempalate.cloneNode(true);
        list.appendChild(item);
        item.classList.remove('hidden');
        let label = item.querySelector('.label');
        let preview = item.querySelector('.preview');
        let value = item.querySelector('.value');
        label.innerHTML = key.substr(2);
        if (key.endsWith('-color') || key.endsWith('-background')) {
            preview.style.background = 'var(' + key + ')';
        }
        value.placeholder = style.get(key)[0];
        value.value = customStyle[key] ?? '';
        value.addEventListener('input', e => {
            if (value.value.trim()) {
                customStyle[key] = value.value.trim();
            }
            else {
                delete customStyle[key];
            }
            applyCustomStyle();
        });
    }
    applyCustomStyle();
}

function toggleSettings()
{
    settings.classList.toggle('hidden');
    if (!settings.classList.contains('hidden')) {
        list.querySelector('.row:not(.hidden)').focus();
    }
    else {
        document.cookie = 'customStyle=' + encodeURIComponent(JSON.stringify(customStyle));
        input.focus();
    }
}

function applyCustomStyle()
{
    let css = ':root{' + Object.entries(customStyle).map(e => e.join(':')).join(';') + '}';
    customCSS.replace(css);
}