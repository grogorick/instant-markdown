
let scrollMargin = 50;

let input = null;
let display = null;
let startInfo = null;
let settings = null;

let docTitle = document.title;
let customStyle = {};
let currentFileHandle = null;
let fileChanged = false;

let sections = [];
let selectionStart = {};
let selectionEnd = {};

let cookies = Object.assign({}, ...document.cookie.split(';').map(c => { c = c.split('='); return { [c[0].trim()]: decodeURIComponent(c[1]) }; }));

let inAppMode = window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: minimal-ui)').matches;

function init()
{
    input = document.querySelector('#input');
    display = document.querySelector('#display');
    startInfo = document.querySelector('#start-info');
    settings = document.querySelector('#settings');
    dragDropIndicator = document.querySelector('#drag-drop-indicator');

    // settings
    setupSettings();

    // load/save local files
    setupFileHandling();

    // editor
    setupMarkdown();
}

function reset(clearFileHandle)
{
    input.value = '';
    display.innerHTML = '';
    startInfo.classList.add('hidden');
    if (clearFileHandle) {
        currentFileHandle = null;
        document.title = docTitle;
    }
    fileChanged = false;
    selectionStart = {};
    selectionEnd = {};
}