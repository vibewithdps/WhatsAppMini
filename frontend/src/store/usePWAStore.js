import { create } from 'zustand';

export const usePWAStore = create((set, get) => ({
  deferredPrompt: null,
  isInstallable: false,
  isInstalled: false,

  setDeferredPrompt: (prompt) =>
    set({ deferredPrompt: prompt, isInstallable: Boolean(prompt) }),

  installApp: async () => {
    const prompt = get().deferredPrompt;
    if (prompt) {
      prompt.prompt();
      const choiceResult = await prompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        set({ isInstalled: true, isInstallable: false, deferredPrompt: null });
      }
    } else {
      // Guide instructions for iOS / browsers without beforeinstallprompt
      alert('To install WhatsApp Mini on your device:\n1. Tap the Share (iOS) or Menu (Android/Chrome) button.\n2. Select "Add to Home Screen" or "Install App".');
    }
  },
}));
