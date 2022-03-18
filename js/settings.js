let currentStyle = 'general';
let customCSS = null;
let customStyleValues = null;
let cssInputs = {};
let lastFocusedCssInput = null;


function setupSettings()
{
    document.addEventListener('keydown', e =>
    {
        if (e.key.toLowerCase() === 'escape') {
            stopEvent(e);
            toggleSettings();
        }
    });
    customCSS = {
        general: new CSSStyleSheet(),
        light: new CSSStyleSheet(),
        dark: new CSSStyleSheet(),
        preview: new CSSStyleSheet()
    };
    document.adoptedStyleSheets = Object.values(customCSS);

    // load saved user style
    let CUSTOM_STYLE_VERSION = 2;
    let customStyleDefault = {
        version: CUSTOM_STYLE_VERSION,
        general: {},
        light: {},
        dark: {}
    };
    if (cookies.customStyle) {
        customStyleValues = JSON.parse(cookies.customStyle);
        customStyleValues.version = parseInt(customStyleValues.version ?? 1);
    }
    else
        customStyleValues = customStyleDefault;

    // upgrade outdated user style
    while (customStyleValues.version++ < CUSTOM_STYLE_VERSION) {
                console.log('update settings ...v' + customStyleValues.version);
        switch (customStyleValues.version) {
            case 2:
                delete customStyleValues.version;
                customStyleValues = {
                    version: 2,
                    general: customStyleValues,
                    light: {},
                    dark: {}
                };
                break;
        }
    }

    // prepare inputs
    let fillCssInputs = () =>
    {
        for (let variable of Object.keys(cssInputs)) {
            cssInputs[variable].IM_value.value = customStyleValues[currentStyle][variable] ?? '';
            cssInputs[variable].IM_value.placeholder = currentStyle === 'general' ? defaultCSS.get(variable)[0] : '';
        }
    };

    let list = settings.querySelector('#list');
    let itemTempalate = list.querySelector('#item-template');
    let defaultCSS = document.styleSheets[0].cssRules[0].styleMap;

    settings.querySelectorAll('.general, .light, .dark').forEach(el => el.addEventListener('click', e =>
    {
        currentStyle = el.className;
        fillCssInputs();
        updatePreviewStyle();
    }));

    for (let key of defaultCSS.keys()) {
        let item = itemTempalate.cloneNode(true);
        list.appendChild(item);
        item.classList.remove('hidden');
        item.IM_label = item.querySelector('.label');
        item.IM_preview = item.querySelector('.preview');
        item.IM_value = item.querySelector('.value');
        cssInputs[key] = item;
        item.IM_label.innerHTML = key.substr(2);
        if (key.endsWith('-color') || key.endsWith('-background')) {
            item.IM_preview.style.background = 'var(' + key + ')';
        }
        item.IM_value.addEventListener('input', e => {
            if (item.IM_value.value.trim()) {
                customStyleValues[currentStyle][key] = item.IM_value.value.trim();
            }
            else {
                delete customStyleValues[currentStyle][key];
            }
            updatePreviewStyle();
        });
    }

    updateCustomStyles();
}

function toggleSettings()
{
    settings.classList.toggle('hidden');
    if (!settings.classList.contains('hidden')) {
        settings.querySelector('.' + currentStyle).click();
        updateCustomStyles('disable');
        (lastFocusedCssInput ?? Object.values(cssInputs)[0].IM_value).focus();
    }
    else {
        updateCustomStyles();
        updatePreviewStyle('disable');
        document.cookie = 'customStyle=' + encodeURIComponent(JSON.stringify(customStyleValues));
        lastFocusedCssInput = document.activeElement;
        input.focus();
    }
}

function updatePreviewStyle(disable = false)
{
    customCSS.preview.replace(disable ? '' : compileCSS(customStyleValues[currentStyle]));
}

function updateCustomStyles(disable = false)
{
    for (style of ['general', 'light', 'dark']) {
        let css = disable ? '' : compileCSS(customStyleValues[style]);
        if (style !== 'general') {
            css = '@media (prefers-color-scheme: ' + style + '){' + css + '}';
        }
        customCSS[style].replace(css);
    }
}

function compileCSS(styleValues)
{
    return ':root{' + Object.entries(styleValues).map(e => e.join(':')).join(';') + '}';
}