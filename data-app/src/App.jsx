import React, { useState, useEffect } from 'react';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Login states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ 
    name: '', email: '', phone: '', password: '', confirmPassword: '' 
  });
  const [isLogin, setIsLogin] = useState(true);

  // OTP Verification states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  // Service products
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedAirtimeNetwork, setSelectedAirtimeNetwork] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [airtimePhoneNumber, setAirtimePhoneNumber] = useState('');
  const [airtimeAmount, setAirtimeAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState(null);

  // API Data states
  const [networks, setNetworks] = useState([]);
  const [dataPlans, setDataPlans] = useState([]);
  const [airtimeNetworks, setAirtimeNetworks] = useState([]);

  // Profile states
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // New states
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [greeting, setGreeting] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // API URLs
  const API_URLS = {
    login: 'http://localhost:5000/api/auth/login',
    signup: 'http://localhost:5000/api/auth/signup',
    verifyOtp: 'http://localhost:5000/api/auth/verify-otp',
    resendOtp: 'http://localhost:5000/api/auth/resend-otp',
    googleAuth: 'http://localhost:5000/api/auth/google',
    profile: 'http://localhost:5000/api/user/profile',
    updateProfile: 'http://localhost:5000/api/user/update-profile',
    changePassword: 'http://localhost:5000/api/user/change-password',
    uploadProfileImage: 'http://localhost:5000/api/user/upload-profile-image',
    referrals: 'http://localhost:5000/api/user/referrals',
    wallet: 'http://localhost:5000/api/wallet',
    fundWallet: 'http://localhost:5000/api/wallet/fund',
    transactions: 'http://localhost:5000/api/wallet/transactions',
    services: 'http://localhost:5000/api/services',
    dataPlans: (network) => `http://localhost:5000/api/services/data-plans/${network}`,
    airtimeNetworks: 'http://localhost:5000/api/services/airtime-networks',
    purchase: 'http://localhost:5000/api/purchase',
    initializePayment: 'http://localhost:5000/api/payments/initialize',
    verifyPayment: 'http://localhost:5000/api/payments/verify'
  };

  // Initialize everything on component mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Update greeting based on time of day
  useEffect(() => {
    updateGreeting();
  }, []);

  // OTP Timer
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Network selection effect
  useEffect(() => {
    if (selectedNetwork && isLoggedIn) {
      fetchDataPlans(selectedNetwork);
    }
  }, [selectedNetwork, isLoggedIn]);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  };

  const initializeApp = async () => {
    try {
      await initializePWA();
      checkDarkMode();
      await checkAuthStatus();
      if (isLoggedIn) {
        await fetchNetworks();
        await fetchAirtimeNetworks();
      }
    } catch (error) {
      console.error('App initialization failed:', error);
      showNotification('Failed to initialize app', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced PWA Implementation
  const initializePWA = async () => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA: Running in standalone mode');
    }

    // Register service worker with enhanced error handling
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA: Service Worker registered successfully');

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('PWA: New service worker found');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showNotification('New version available! Refresh to update.', 'info');
            }
          });
        });
      } catch (error) {
        console.error('PWA: Service Worker registration failed:', error);
        // Fallback: Create a basic service worker registration
        try {
          const registration = await navigator.serviceWorker.register('/sw-fallback.js');
          console.log('PWA: Fallback Service Worker registered');
        } catch (fallbackError) {
          console.error('PWA: Fallback Service Worker also failed');
        }
      }
    }

    // Enhanced beforeinstallprompt handling
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      
      // Show install prompt after a short delay
      setTimeout(() => {
        showPWAInstallPrompt();
      }, 3000);
    });

    // App installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App was installed');
      window.deferredPrompt = null;
      showNotification('JAYSUB installed successfully!', 'success');
    });

    // Check if PWA is launchable
    if ('getInstalledRelatedApps' in navigator) {
      navigator.getInstalledRelatedApps().then(apps => {
        if (apps.length > 0) {
          console.log('PWA: App is already installed');
        }
      });
    }
  };

  const showPWAInstallPrompt = () => {
    if (window.deferredPrompt && !localStorage.getItem('pwaPromptDismissed')) {
      showNotification(
        'Install JAYSUB for better experience! 📱', 
        'info', 
        'Install', 
        handlePwaInstall
      );
    }
  };

  const handlePwaInstall = async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
        localStorage.setItem('pwaPromptDismissed', 'true');
      }
      window.deferredPrompt = null;
    }
  };

  const checkDarkMode = () => {
    const savedDarkMode = localStorage.getItem('jaysub_darkmode');
    if (savedDarkMode === 'true') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('jaysub_darkmode', newDarkMode.toString());
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    showNotification(`Dark mode ${newDarkMode ? 'ON' : 'OFF'}`, 'success');
  };

  const toggleNotifications = () => {
    const newNotificationsState = !notificationsEnabled;
    setNotificationsEnabled(newNotificationsState);
    
    if (newNotificationsState && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showNotification('Notifications enabled', 'success');
          new Notification('JAYSUB', {
            body: 'Notifications are now enabled!',
            icon: '/icon-192x192.png'
          });
        }
      });
    } else {
      showNotification('Notifications disabled', 'info');
    }
  };

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('jaysub_token');
    
    if (token) {
      try {
        const response = await fetch(API_URLS.profile, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsLoggedIn(true);
          setWalletBalance(userData.walletBalance || 0);
          setProfileData({
            name: userData.name,
            email: userData.email,
            phone: userData.phone
          });
          setProfileImageUrl(userData.profileImage || '');
          setReferralCode(userData.referralCode || '');
          await fetchReferrals();
          await fetchTransactions();
        } else {
          localStorage.removeItem('jaysub_token');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('jaysub_token');
      }
    }
  };

  // Enhanced Network Fetching
  const fetchNetworks = async () => {
    try {
      const token = localStorage.getItem('jaysub_token');
      const response = await fetch(API_URLS.services, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNetworks(data.networks || []);
        
        if (data.networks && data.networks.length > 0) {
          setSelectedNetwork(data.networks[0].code);
        }
      } else {
        throw new Error('Failed to fetch networks');
      }
    } catch (error) {
      console.error('Failed to fetch networks:', error);
      // Fallback networks
      setNetworks([
        { code: 'mtn', name: 'MTN Nigeria' },
        { code: 'airtel', name: 'Airtel Nigeria' },
        { code: 'glo', name: 'Glo Nigeria' },
        { code: 'etisalat', name: '9mobile Nigeria' }
      ]);
      setSelectedNetwork('mtn');
    }
  };

  // Enhanced Airtime Networks Fetching
  const fetchAirtimeNetworks = async () => {
    try {
      const token = localStorage.getItem('jaysub_token');
      const response = await fetch(API_URLS.airtimeNetworks, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAirtimeNetworks(data.networks || []);
        
        if (data.networks && data.networks.length > 0) {
          setSelectedAirtimeNetwork(data.networks[0].code);
        }
      } else {
        throw new Error('Failed to fetch airtime networks');
      }
    } catch (error) {
      console.error('Failed to fetch airtime networks:', error);
      // Fallback airtime networks
      setAirtimeNetworks([
        { code: 'mtn', name: 'MTN Nigeria' },
        { code: 'airtel', name: 'Airtel Nigeria' },
        { code: 'glo', name: 'Glo Nigeria' },
        { code: 'etisalat', name: '9mobile Nigeria' }
      ]);
      setSelectedAirtimeNetwork('mtn');
    }
  };

  // Enhanced Data Plans Fetching
  const fetchDataPlans = async (networkCode) => {
    if (!networkCode) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('jaysub_token');
      const response = await fetch(API_URLS.dataPlans(networkCode), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDataPlans(data.plans || []);
      } else {
        throw new Error('Failed to fetch data plans');
      }
    } catch (error) {
      console.error('Failed to fetch data plans:', error);
      // Fallback data plans
      setDataPlans([
        { id: '1gb', name: '1GB', price: 300 },
        { id: '2gb', name: '2GB', price: 500 },
        { id: '5gb', name: '5GB', price: 1000 }
      ]);
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('jaysub_token');
      const response = await fetch(API_URLS.transactions, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  // Google Sign-in Handler
  const handleGoogleSignIn = async () => {
    setActionLoading(true);
    try {
      // Open Google OAuth in new window or redirect
      const googleAuthUrl = `${API_URLS.googleAuth}?redirect=${encodeURIComponent(window.location.origin)}`;
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('Google sign-in failed:', error);
      showNotification('Google sign-in failed. Please try again.', 'error');
      setActionLoading(false);
    }
  };

  // Handle signup with OTP
  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupData.password !== signupData.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(API_URLS.signup, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          phone: signupData.phone,
          password: signupData.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpEmail(signupData.email);
        setShowOtpModal(true);
        setOtpTimer(300); // 5 minutes
        showNotification('OTP sent to your email!', 'success');
      } else {
        showNotification(data.message || 'Signup failed', 'error');
      }
    } catch (error) {
      showNotification('Signup failed. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      showNotification('Please enter complete OTP', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(API_URLS.verifyOtp, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: otpEmail,
          otp: otp
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData = data.user;
        setUser(userData);
        setIsLoggedIn(true);
        setWalletBalance(userData.walletBalance || 0);
        setProfileData({
          name: userData.name,
          email: userData.email,
          phone: userData.phone
        });
        setReferralCode(userData.referralCode);
        
        localStorage.setItem('jaysub_token', data.token);
        setShowOtpModal(false);
        setOtp('');
        showNotification('Account verified successfully!', 'success');
        
        // Fetch initial data
        await fetchNetworks();
        await fetchAirtimeNetworks();
        await fetchReferrals();
      } else {
        showNotification(data.message || 'OTP verification failed', 'error');
      }
    } catch (error) {
      showNotification('OTP verification failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(API_URLS.resendOtp, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: otpEmail
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpTimer(300);
        showNotification('New OTP sent to your email!', 'success');
      } else {
        showNotification(data.message || 'Failed to resend OTP', 'error');
      }
    } catch (error) {
      showNotification('Failed to resend OTP', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const response = await fetch(API_URLS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData = data.user;
        
        setUser(userData);
        setIsLoggedIn(true);
        setWalletBalance(userData.walletBalance || 0);
        setProfileData({
          name: userData.name,
          email: userData.email,
          phone: userData.phone
        });
        setProfileImageUrl(userData.profileImage || '');
        setReferralCode(userData.referralCode);
        
        localStorage.setItem('jaysub_token', data.token);
        showNotification('Login successful!', 'success');
        
        // Fetch initial data
        await fetchNetworks();
        await fetchAirtimeNetworks();
        await fetchReferrals();
        await fetchTransactions();
      } else {
        showNotification(data.message || 'Login failed', 'error');
      }
    } catch (error) {
      showNotification('Login failed. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setWalletBalance(0);
    setTransactions([]);
    localStorage.removeItem('jaysub_token');
    setCurrentView('dashboard');
    showNotification('Logged out successfully', 'success');
  };

  // Handle wallet funding
  const handleFundWallet = async (amount) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('jaysub_token');
      const response = await fetch(API_URLS.initializePayment, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          amount: amount,
          email: user.email 
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to payment page or handle payment gateway
        window.location.href = data.paymentUrl;
      } else {
        showNotification(data.message || 'Payment initialization failed', 'error');
      }
    } catch (error) {
      showNotification('Payment failed. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle purchase
  const handlePurchase = async (type, amount, planName = null) => {
    const targetPhone = type === 'data' ? phoneNumber : airtimePhoneNumber;
    const targetNetwork = type === 'data' ? selectedNetwork : selectedAirtimeNetwork;

    if (!targetPhone) {
      showNotification('Please enter phone number', 'error');
      return;
    }

    if (walletBalance < amount) {
      showNotification('Insufficient wallet balance', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('jaysub_token');
      const response = await fetch(API_URLS.purchase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: type,
          amount: amount,
          planName: planName,
          network: targetNetwork,
          phoneNumber: targetPhone
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newBalance = data.newBalance;
        setWalletBalance(newBalance);
        
        const updatedUser = { ...user, walletBalance: newBalance };
        setUser(updatedUser);
        
        // Add to transactions
        const description = type === 'data' 
          ? `${getNetworkName(targetNetwork)} Data - ${planName}`
          : `${getNetworkName(targetNetwork)} Airtime`;
          
        addTransaction('debit', amount, description, data.reference);
        showNotification(`Purchase successful for ${targetPhone}!`, 'success');
        
        // Reset forms
        setPhoneNumber('');
        setAirtimePhoneNumber('');
        setAirtimeAmount('');
        setSelectedPlan('');
      } else {
        showNotification(data.message || 'Purchase failed', 'error');
      }
    } catch (error) {
      showNotification('Purchase failed. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle profile image upload
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Image size should be less than 5MB', 'error');
      return;
    }

    setActionLoading(true);
    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const token = localStorage.getItem('jaysub_token');
      const response = await fetch(API_URLS.uploadProfileImage, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProfileImageUrl(data.profileImageUrl);
        const updatedUser = { ...user, profileImage: data.profileImageUrl };
        setUser(updatedUser);
        showNotification('Profile image updated successfully!', 'success');
      } else {
        showNotification(data.message || 'Failed to upload image', 'error');
      }
    } catch (error) {
      showNotification('Failed to upload image', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const token = localStorage.getItem('jaysub_token');
      const response = await fetch(API_URLS.updateProfile, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const updatedUser = { ...user, name: profileData.name, phone: profileData.phone };
        setUser(updatedUser);
        showNotification('Profile updated successfully!', 'success');
      } else {
        showNotification(data.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      showNotification('Failed to update profile', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (profileData.newPassword !== profileData.confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('jaysub_token');
      const response = await fetch(API_URLS.changePassword, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProfileData({
          ...profileData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        showNotification('Password changed successfully!', 'success');
      } else {
        showNotification(data.message || 'Failed to change password', 'error');
      }
    } catch (error) {
      showNotification('Failed to change password', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch referrals
  const fetchReferrals = async () => {
    try {
      const token = localStorage.getItem('jaysub_token');
      const response = await fetch(API_URLS.referrals, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReferrals(data.referrals || []);
      }
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    }
  };

  // Helper functions
  const addTransaction = (type, amount, description, reference) => {
    const transaction = {
      id: Date.now(),
      type,
      amount,
      description,
      reference,
      date: new Date().toLocaleString(),
      status: 'completed'
    };
    setTransactions([transaction, ...transactions.slice(0, 49)]);
  };

  const showNotification = (message, type = 'info', actionText = null, actionCallback = null) => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let notificationHTML = `<span>${message}</span>`;
    
    if (actionText && actionCallback) {
      notificationHTML += `<button class="notification-action" onclick="(${actionCallback})()">${actionText}</button>`;
    }
    
    notificationHTML += '<button class="notification-close" onclick="this.parentElement.remove()">×</button>';
    
    notification.innerHTML = notificationHTML;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;

    // Add close button styles
    const style = document.createElement('style');
    style.textContent = `
      .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: 10px;
      }
      .notification-action {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 10px;
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  };

  const getNetworkName = (code) => {
    const network = networks.find(n => n.code === code) || airtimeNetworks.find(n => n.code === code);
    return network ? network.name : code;
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show preloader while loading
  if (isLoading) {
    return (
      <div className="preloader-overlay">
        <div className="preloader-content">
          <div className="preloader-spinner"></div>
          <h2>JAYSUB</h2>
          <p>Loading your experience...</p>
        </div>
      </div>
    );
  }

  // OTP Verification Modal
  if (showOtpModal) {
    return (
      <div className="otp-modal-overlay">
        <div className="otp-modal">
          <div className="otp-header">
            <h3>Verify Your Email</h3>
            <p>Enter the 6-digit code sent to {otpEmail}</p>
          </div>
          
          <div className="otp-input-container">
            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              disabled={actionLoading}
              className="otp-input"
            />
          </div>

          <div className="otp-timer">
            {otpTimer > 0 ? (
              <p>Time remaining: {formatTimer(otpTimer)}</p>
            ) : (
              <p>OTP expired</p>
            )}
          </div>

          <div className="otp-actions">
            <button
              onClick={handleVerifyOtp}
              disabled={actionLoading || otp.length !== 6}
              className="verify-btn"
            >
              {actionLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            
            <button
              onClick={handleResendOtp}
              disabled={actionLoading || otpTimer > 0}
              className="resend-btn"
            >
              Resend OTP {otpTimer > 0 && `(${formatTimer(otpTimer)})`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login/Signup Form
  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        {actionLoading && <div className="action-preloader">Processing...</div>}
        
        <div className="auth-card">
          <div className="auth-header">
            <h1>JAYSUB</h1>
            <p>Buy Cheap Data & Airtime Instantly</p>
          </div>

          <div className="auth-tabs">
            <button 
              className={isLogin ? 'active' : ''} 
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button 
              className={!isLogin ? 'active' : ''} 
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          {/* Google Sign-in Button */}
          <div className="social-auth">
            <button 
              onClick={handleGoogleSignIn}
              className="google-signin-btn"
              disabled={actionLoading}
            >
              <span className="google-icon">G</span>
              Sign in with Google
            </button>
          </div>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          {isLogin ? (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  required
                  disabled={actionLoading}
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  required
                  disabled={actionLoading}
                />
              </div>
              <button type="submit" className="auth-btn" disabled={actionLoading}>
                {actionLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="auth-form">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={signupData.name}
                  onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                  required
                  disabled={actionLoading}
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={signupData.email}
                  onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                  required
                  disabled={actionLoading}
                />
              </div>
              <div className="form-group">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={signupData.phone}
                  onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                  required
                  disabled={actionLoading}
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                  required
                  disabled={actionLoading}
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                  required
                  disabled={actionLoading}
                />
              </div>
              <button type="submit" className="auth-btn" disabled={actionLoading}>
                {actionLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Main App after login
  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      {actionLoading && <div className="action-preloader">Processing...</div>}
      
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1>JAYSUB</h1>
          <div className="user-menu">
            <span>{greeting}, {user?.name}</span>
            <div className="wallet-badge">
              ₦{walletBalance.toLocaleString()}
            </div>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {/* Bottom Navigation for Mobile/PWA - HORIZONTAL */}
      <nav className="bottom-navigation">
        <div className="nav-container">
          <button 
            className={currentView === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </button>
          <button 
            className={currentView === 'data' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setCurrentView('data')}
          >
            <span className="nav-icon">📱</span>
            <span className="nav-label">Buy Data</span>
          </button>
          <button 
            className={currentView === 'airtime' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setCurrentView('airtime')}
          >
            <span className="nav-icon">📞</span>
            <span className="nav-label">Buy Airtime</span>
          </button>
          <button 
            className={currentView === 'wallet' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setCurrentView('wallet')}
          >
            <span className="nav-icon">💳</span>
            <span className="nav-label">Wallet</span>
          </button>
          <button 
            className={currentView === 'profile' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setCurrentView('profile')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Profile</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main">
        {currentView === 'dashboard' && (
          <div className="dashboard">
            <div className="welcome-section">
              <h2>{greeting}, {user?.name}! 👋</h2>
              <p>What would you like to do today?</p>
            </div>

            <div className="balance-card">
              <div className="balance-info">
                <h3>Wallet Balance</h3>
                <h2>₦{walletBalance.toLocaleString()}</h2>
              </div>
              <button 
                onClick={() => setShowFundModal(true)}
                className="fund-btn"
              >
                Fund Wallet
              </button>
            </div>

            <div className="quick-actions">
              <h3>Quick Services</h3>
              <div className="actions-grid">
                <div className="action-card" onClick={() => setCurrentView('data')}>
                  <div className="action-icon">📱</div>
                  <span>Buy Data</span>
                  <p>Instant delivery</p>
                </div>
                <div className="action-card" onClick={() => setCurrentView('airtime')}>
                  <div className="action-icon">📞</div>
                  <span>Buy Airtime</span>
                  <p>Any network</p>
                </div>
                <div className="action-card" onClick={() => setShowFundModal(true)}>
                  <div className="action-icon">💳</div>
                  <span>Fund Wallet</span>
                  <p>Add funds</p>
                </div>
                <div className="action-card" onClick={() => setCurrentView('profile')}>
                  <div className="action-icon">👥</div>
                  <span>Refer & Earn</span>
                  <p>Get ₦200 bonus</p>
                </div>
              </div>
            </div>

            <div className="recent-transactions">
              <div className="section-header">
                <h3>Recent Transactions</h3>
                {transactions.length > 0 && (
                  <button onClick={() => setCurrentView('wallet')}>View All</button>
                )}
              </div>
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <p>No transactions yet</p>
                  <small>Your transactions will appear here</small>
                </div>
              ) : (
                transactions.slice(0, 5).map(transaction => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-info">
                      <p className="transaction-desc">{transaction.description}</p>
                      <p className="transaction-date">{transaction.date}</p>
                    </div>
                    <p className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'debit' ? '-' : '+'}₦{transaction.amount}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {currentView === 'data' && (
          <div className="service-page">
            <h2>Buy Data</h2>
            {actionLoading && <div className="loading-text">Loading data plans...</div>}
            <div className="service-form">
              <div className="form-group">
                <label>Select Network</label>
                <select 
                  value={selectedNetwork} 
                  onChange={(e) => {
                    setSelectedNetwork(e.target.value);
                    fetchDataPlans(e.target.value);
                  }}
                  disabled={actionLoading}
                >
                  {networks.map(network => (
                    <option key={network.code} value={network.code}>
                      {network.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08012345678"
                  disabled={actionLoading}
                />
              </div>

              <div className="plans-grid">
                <label>Select Data Plan</label>
                {dataPlans.length > 0 ? (
                  <div className="plans-container">
                    {dataPlans.map(plan => (
                      <div 
                        key={plan.id}
                        className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
                        onClick={() => !actionLoading && setSelectedPlan(plan.id)}
                      >
                        <div className="plan-info">
                          <h4>{plan.name}</h4>
                          <p className="plan-price">₦{plan.price}</p>
                        </div>
                        {selectedPlan === plan.id && (
                          <button 
                            className="buy-now-btn"
                            onClick={() => handlePurchase('data', plan.price, plan.name)}
                            disabled={!phoneNumber || actionLoading}
                          >
                            {actionLoading ? 'Processing...' : 'Buy Now'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No data plans available</p>
                    <small>Please select a network</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === 'airtime' && (
          <div className="service-page">
            <h2>Buy Airtime</h2>
            <div className="service-form">
              <div className="form-group">
                <label>Select Network</label>
                <select 
                  value={selectedAirtimeNetwork} 
                  onChange={(e) => setSelectedAirtimeNetwork(e.target.value)}
                  disabled={actionLoading}
                >
                  {airtimeNetworks.map(network => (
                    <option key={network.code} value={network.code}>
                      {network.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={airtimePhoneNumber}
                  onChange={(e) => setAirtimePhoneNumber(e.target.value)}
                  placeholder="08012345678"
                  disabled={actionLoading}
                />
              </div>

              <div className="form-group">
                <label>Amount (₦)</label>
                <input
                  type="number"
                  value={airtimeAmount}
                  onChange={(e) => setAirtimeAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="50"
                  disabled={actionLoading}
                />
              </div>

              <div className="quick-amounts-grid">
                {[100, 200, 500, 1000, 2000].map(amount => (
                  <button
                    key={amount}
                    className="amount-btn"
                    onClick={() => setAirtimeAmount(amount.toString())}
                    disabled={actionLoading}
                  >
                    ₦{amount}
                  </button>
                ))}
              </div>

              <button 
                className="buy-now-btn large"
                onClick={() => handlePurchase('airtime', parseFloat(airtimeAmount))}
                disabled={!airtimePhoneNumber || !airtimeAmount || parseFloat(airtimeAmount) < 50 || actionLoading}
              >
                {actionLoading ? 'Processing...' : `Buy ₦${airtimeAmount} Airtime`}
              </button>
            </div>
          </div>
        )}

        {currentView === 'wallet' && (
          <div className="wallet-page">
            <h2>Wallet</h2>
            
            <div className="wallet-overview">
              <div className="balance-card large">
                <div className="balance-info">
                  <h3>Current Balance</h3>
                  <h1>₦{walletBalance.toLocaleString()}</h1>
                </div>
                <button 
                  onClick={() => setShowFundModal(true)}
                  className="fund-btn large"
                >
                  Fund Wallet
                </button>
              </div>

              <div className="quick-fund-section">
                <h3>Quick Fund Amounts</h3>
                <div className="quick-amounts-grid">
                  {[500, 1000, 2000, 5000, 10000, 20000].map(amount => (
                    <button
                      key={amount}
                      className="amount-card"
                      onClick={() => {
                        setFundAmount(amount.toString());
                        setShowFundModal(true);
                      }}
                    >
                      <span>₦{amount.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="transactions-section">
              <div className="section-header">
                <h3>Transaction History</h3>
              </div>
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <p>No transactions yet</p>
                  <small>Your transactions will appear here</small>
                </div>
              ) : (
                <div className="transactions-list">
                  {transactions.map(transaction => (
                    <div key={transaction.id} className="transaction-item detailed">
                      <div className="transaction-icon">
                        {transaction.type === 'credit' ? '📥' : '📤'}
                      </div>
                      <div className="transaction-info">
                        <p className="transaction-desc">{transaction.description}</p>
                        <p className="transaction-date">{transaction.date}</p>
                        <p className="transaction-reference">Ref: {transaction.reference}</p>
                      </div>
                      <p className={`transaction-amount ${transaction.type}`}>
                        {transaction.type === 'debit' ? '-' : '+'}₦{transaction.amount}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'profile' && (
          <div className="profile-page">
            <h2>Profile</h2>
            
            <div className="profile-section">
              <div className="profile-header">
                <div className="profile-image-section">
                  <div className="profile-image-container">
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Profile" className="profile-image" />
                    ) : (
                      <div className="profile-image-placeholder">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <label htmlFor="profile-upload" className="upload-overlay">
                      Change Photo
                    </label>
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <h3>{user?.name}</h3>
                  <p>{user?.email}</p>
                </div>
              </div>

              <div className="profile-content">
                <div className="profile-card">
                  <h4>Personal Information</h4>
                  <form onSubmit={handleProfileUpdate}>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        disabled={actionLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="disabled"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        disabled={actionLoading}
                      />
                    </div>
                    <button type="submit" className="save-btn" disabled={actionLoading}>
                      {actionLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>

                <div className="profile-card">
                  <h4>Change Password</h4>
                  <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        value={profileData.currentPassword}
                        onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
                        disabled={actionLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
                        disabled={actionLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
                        disabled={actionLoading}
                      />
                    </div>
                    <button type="submit" className="save-btn" disabled={actionLoading}>
                      {actionLoading ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                </div>

                <div className="profile-card">
                  <h4>Refer & Earn</h4>
                  <div className="referral-section">
                    <p>Invite friends and earn ₦200 when they sign up and fund their wallet!</p>
                    <div className="referral-code">
                      <label>Your Referral Code:</label>
                      <div className="code-display">
                        <span>{referralCode}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(referralCode);
                            showNotification('Referral code copied!', 'success');
                          }}
                          className="copy-btn"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="referral-stats">
                      <div className="stat-item">
                        <span className="stat-number">{referrals.length}</span>
                        <span className="stat-label">Referred Users</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">₦{referrals.length * 200}</span>
                        <span className="stat-label">Total Earnings</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="profile-card">
                  <h4>Preferences</h4>
                  <div className="preferences">
                    <div className="preference-item">
                      <span>Dark Mode</span>
                      <div className="toggle-container">
                        <span className="toggle-label">{darkMode ? 'ON' : 'OFF'}</span>
                        <div className={`toggle-switch ${darkMode ? 'active' : ''}`} onClick={toggleDarkMode}>
                          <div className="toggle-slider"></div>
                        </div>
                      </div>
                    </div>
                    <div className="preference-item">
                      <span>Notifications</span>
                      <div className="toggle-container">
                        <span className="toggle-label">{notificationsEnabled ? 'ON' : 'OFF'}</span>
                        <div className={`toggle-switch ${notificationsEnabled ? 'active' : ''}`} onClick={toggleNotifications}>
                          <div className="toggle-slider"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fund Wallet Modal */}
      {showFundModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Fund Wallet</h3>
            <div className="form-group">
              <label>Amount (₦)</label>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="Enter amount"
                min="100"
                disabled={actionLoading}
              />
            </div>
            <div className="quick-amounts-grid">
              {[500, 1000, 2000, 5000, 10000].map(amount => (
                <button
                  key={amount}
                  className="amount-btn"
                  onClick={() => setFundAmount(amount.toString())}
                >
                  ₦{amount}
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setShowFundModal(false)}
                className="cancel-btn"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleFundWallet(parseFloat(fundAmount))}
                className="confirm-btn"
                disabled={!fundAmount || parseFloat(fundAmount) < 100 || actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;