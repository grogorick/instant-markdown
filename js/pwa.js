// If we can register a service worker, we can offer to install as PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('pwa-sw.js')
            .then(registration =>
            {
                console.log('(new) service worker registered for: ', registration.scope);

                if (!navigator.serviceWorker.controller) {
                    // first visit - no previous worker to update
                    console.log('no previous service worker');
                    return;
                }
                console.log('previous service worker running');
                navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' });

                // check for updates
                setInterval(() => {
                    console.log('update?');
                    registration.update();
                }, 24 * 60 * 60 * 1000);

                // handle updates
                let showUpdateMessage = () => document.querySelector('#update-notification').classList.remove('hidden');
                let waitForInstallToComplete = newWorker =>
                {
                    newWorker.addEventListener('statechange', () =>
                    {
                        if (newWorker.state === 'installed') // `registration.waiting`
                            showUpdateMessage();
                    });
                };
                registration.addEventListener('updatefound', () => waitForInstallToComplete(registration.installing));
                if (registration.installing) // in case the installation already started (missed the `updatefound` event)
                    waitForInstallToComplete(registration.installing);
                else if (registration.waiting)// in case the whole installation is already finished
                    showUpdateMessage();
            })
            .catch(err => console.log('service worker registration failed: ', err));

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