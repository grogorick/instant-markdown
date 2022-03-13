let fileTypeDialogOption = { types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }] };

function setupFileHandling()
{
    let warningMsg = 'Changes to the current document will be lost.';
    let hideDragDropIndicator = debounce(500, () => dragDropIndicator.classList.add('hidden'));
    document.addEventListener('dragover', e =>
    {
        e.preventDefault();
        dragDropIndicator.classList.remove('hidden');
        hideDragDropIndicator();
    });
    document.addEventListener('drop', async e =>
    {
        e.preventDefault();
        dragDropIndicator.classList.add('hidden');
        if (fileChanged && !confirm(warningMsg + ' Proceed to open the dropped file?'))
            return;
        if (e.dataTransfer.items.length > 1) {
            alert('Only a single file can be loaded.');
            return;
        }
        let dataItem = e.dataTransfer.items[0];
        if (dataItem.kind === 'file') {
            currentFileHandle = await dataItem.getAsFileSystemHandle();
            loadFile();
        }
    });
    document.addEventListener('keydown', e =>
    {
        if (e.ctrlKey) {
            switch (e.key.toLowerCase()) {
                case 'o':
                    stopEvent(e);
                    if (fileChanged && !confirm(warningMsg + ' Proceed to open another file?'))
                        return;
                    (async () => {
                        [currentFileHandle] = await window.showOpenFilePicker(fileTypeDialogOption);
                        loadFile();
                    })();
                break;
                case 's':
                    stopEvent(e);
                    (async () => {
                        saveFile();
                    })();
                break;
                case 'n':
                case 'q':
                    stopEvent(e);
                    if (fileChanged && !confirm(warningMsg + ' Proceed to start a new file?'))
                        return;
                    reset(true);
                    updateMarkdown();
                break;
                default:
            }
        }
    });
    window.addEventListener('beforeunload', e => {
        if (fileChanged) {
            e.preventDefault();
            let msg = warningMsg + ' Close ' + docTitle + '?';
            (e || window.event).returnValue = msg;
            return msg;
        }
    });
}

async function loadFile()
{
    if (currentFileHandle.kind !== 'file') {
        currentFileHandle = null;
        alert('Only files can be loaded.');
        return;
    }
    if (!currentFileHandle.name.endsWith('.md')) {
        currentFileHandle = null;
        alert('Only Markdown (.md) files can be loaded.');
        return;
    }
    console.log('try to load file: ' + currentFileHandle.name);
    let file = await currentFileHandle.getFile();
    let reader = new FileReader();
    reader.addEventListener('load', () => {
        reset(false);
        document.title = currentFileHandle.name + (!inAppMode ? ' - ' + docTitle : '');
        input.value = reader.result;
        updateMarkdown();
        console.log('file loaded: ' + currentFileHandle.name);
    }, false);
    reader.readAsText(file);
}

async function saveFile()
{
    if (!currentFileHandle) {
        currentFileHandle = await window.showSaveFilePicker(fileTypeDialogOption);
        if (!currentFileHandle) {
            return;
        }
    }
    let writableStream = await currentFileHandle.createWritable();
    await writableStream.write(input.value);
    await writableStream.close();
    fileChanged = false;
    document.title = currentFileHandle.name + (!inAppMode ? ' - ' + docTitle : '');
    console.log('file saved: ' + currentFileHandle.name);
}