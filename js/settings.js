function setupSettings()
{
    document.addEventListener('keydown', async e =>
    {
        if (e.key.toLowerCase() === 'escape') {
            e.preventDefault();
            toggleSettings();
        }
    });
    customStyle = new CSSStyleSheet();
    document.adoptedStyleSheets = [customStyle];
    if ('customStyle' in cookies)
        settingsInput.value = cookies.customStyle;
    else {
        let style = document.styleSheets[0].cssRules[0].styleMap;
        let defaultStyle = '';
        for (let key of style.keys()) {
            defaultStyle += key + ':' + style.get(key) + ';\n';
        }
        settingsInput.value = defaultStyle;
    }
    settingsInput.addEventListener('input', e => {
        applyCustomStyle();
    });
    applyCustomStyle();
}

function toggleSettings()
{
    settings.classList.toggle('hidden');
    if (!settings.classList.contains('hidden')) {
        settingsInput.focus();
    }
    else {
        document.cookie = 'customStyle=' + encodeURIComponent(settingsInput.value);
        input.focus();
    }
}

function applyCustomStyle()
{
    customStyle.replace(':root{' + settingsInput.value + '}');
}