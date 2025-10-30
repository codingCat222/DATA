import { useState, useEffect } from 'react';
import './InstallBanner.css';

const InstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show our custom banner
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Hide banner if app is already installed
    window.addEventListener('appinstalled', () => {
      console.log('App was installed');
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the native install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsVisible(false);
    }

    // Clear the saved prompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Optional: Save to localStorage to not show again for some time
    localStorage.setItem('installBannerDismissed', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="install-banner">
      <div className="install-banner-content">
        <div className="app-info">
          <div className="app-icon">📱</div>
          <div className="app-details">
            <div className="app-name">DataStore</div>
            <div className="app-website">data-iota-lovat.vercel.app</div>
          </div>
        </div>
        <div className="install-actions">
          <button className="dismiss-btn" onClick={handleDismiss}>
            ×
          </button>
          <button className="install-btn" onClick={handleInstall}>
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;
