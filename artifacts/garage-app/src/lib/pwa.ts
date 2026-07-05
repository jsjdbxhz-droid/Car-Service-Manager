// Captures the browser's beforeinstallprompt event so we can trigger PWA install on demand.
// Import this module early (e.g. main.tsx) to register the listener before any user interaction.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let _deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredPrompt = e as BeforeInstallPromptEvent;
});

window.addEventListener('appinstalled', () => {
  _deferredPrompt = null;
});

export function getInstallPrompt(): BeforeInstallPromptEvent | null {
  return _deferredPrompt;
}

export function clearInstallPrompt(): void {
  _deferredPrompt = null;
}
