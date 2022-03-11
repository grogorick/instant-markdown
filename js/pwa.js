// If we can register a service worker, we can offer to install as PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('pwa-sw.js').then(
            registration => console.log('ServiceWorker registered for: ', registration.scope),
            err => console.log('ServiceWorker registration failed: ', err)
        );

        let deferredPrompt = null;
        window.addEventListener('beforeinstallprompt', e => {
            e.preventDefault();
            deferredPrompt = e;
            console.log('(ready to install PWA)');

            let btn = document.querySelector('#pwa-install');
            btn.addEventListener('click', async () => {
                btn.classList.add('hidden');
                // Show browser prompt to install
                console.log('install?...');
                deferredPrompt.prompt();
                let { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'dismissed')
                    console.log('-> cancelled');
                deferredPrompt = null;
            });
            btn.classList.remove('hidden');
        });
    });
}