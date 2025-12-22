import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import toast from 'react-hot-toast';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if app is installed on iOS
    if (window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show our custom install prompt
      setShowPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      toast.success('App installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if prompt was previously dismissed (stored in localStorage)
    const promptDismissed = localStorage.getItem('installPromptDismissed');
    const promptDismissedTime = localStorage.getItem('installPromptDismissedTime');
    
    // Show prompt again after 7 days if it was dismissed
    if (promptDismissed && promptDismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(promptDismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowPrompt(false);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If deferredPrompt is not available, show instructions for manual install
      toast('Please use your browser\'s install option from the menu', {
        icon: 'ℹ️',
        duration: 5000,
      });
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast.success('Installing app...');
    } else {
      toast('Installation cancelled', {
        icon: 'ℹ️',
      });
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
    localStorage.setItem('installPromptDismissedTime', Date.now().toString());
  };

  // Don't show if already installed or prompt is dismissed
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-lg overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
            <img 
              src="/icon.png" 
              alt="WaterSight" 
              className="h-full w-full object-contain p-1"
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = e.target.parentElement.querySelector('.icon-fallback');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="h-full w-full items-center justify-center hidden icon-fallback bg-primary-100">
              <Download className="h-5 w-5 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Install WaterSight
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Install our app for a better experience. Quick access, offline support, and more!
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
            >
              <Download className="h-3 w-3 mr-1.5" />
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;

