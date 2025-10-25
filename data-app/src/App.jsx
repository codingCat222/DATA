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
  const [selectedNetwork, setSelectedNetwork] = useState('mtn');
  const [selectedAirtimeNetwork, setSelectedAirtimeNetwork] = useState('mtn');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [airtimePhoneNumber, setAirtimePhoneNumber] = useState('');
  const [airtimeAmount, setAirtimeAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState(null);

  // API Data states
  const [networks, setNetworks] = useState([
    { code: 'mtn', name: 'MTN Nigeria' },
    { code: 'airtel', name: 'Airtel Nigeria' },
    { code: 'glo', name: 'Glo Nigeria' },
    { code: 'etisalat', name: '9mobile Nigeria' }
  ]);
  const [dataPlans, setDataPlans] = useState([]);
  const [airtimeNetworks, setAirtimeNetworks] = useState([
    { code: 'mtn', name: 'MTN Nigeria' },
    { code: 'airtel', name: 'Airtel Nigeria' },
    { code: 'glo', name: 'Glo Nigeria' },
    { code: 'etisalat', name: '9mobile Nigeria' }
  ]);

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

  // Google Client ID
  const GOOGLE_CLIENT_ID = "359926094033-rl57709vq8llcjvgc45pdljt3srp3g9n.apps.googleusercontent.com";

  // API URLs - Updated to your backend
  const API_BASE_URL = 'https://data-dqrk.onrender.com';
  const API_URLS = {
    login: `${API_BASE_URL}/api/auth/login`,
    signup: `${API_BASE_URL}/api/auth/signup`,
    verifyOtp: `${API_BASE_URL}/api/auth/verify-otp`,
    resendOtp: `${API_BASE_URL}/api/auth/resend-otp`,
    googleAuth: `${API_BASE_URL}/api/auth/google`,
    profile: `${API_BASE_URL}/api/user/profile`,
    updateProfile: `${API_BASE_URL}/api/user/update-profile`,
    changePassword: `${API_BASE_URL}/api/user/change-password`,
    uploadProfileImage: `${API_BASE_URL}/api/user/upload-profile-image`,
    referrals: `${API_BASE_URL}/api/user/referrals`,
    wallet: `${API_BASE_URL}/api/wallet`,
    fundWallet: `${API_BASE_URL}/api/wallet/fund`,
    transactions: `${API_BASE_URL}/api/wallet/transactions`,
    services: `${API_BASE_URL}/api/services`,
    dataPlans: (network) => `${API_BASE_URL}/api/services/data-plans/${network}`,
    airtimeNetworks: `${API_BASE_URL}/api/services/airtime-networks`,
    purchase: `${API_BASE_URL}/api/purchase`,
    initializePayment: `${API_BASE_URL}/api/payments/initialize`,
    verifyPayment: `${API_BASE_URL}/api/payments/verify`
  };

  // Initialize Google Sign-In
  useEffect(() => {
    initializeGoogleSignIn();
  }, []);

  const initializeGoogleSignIn = () => {
    // Check if script is already loaded
    if (window.google) {
      return;
    }

    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        
        // Render Google Sign-In button
        if (document.getElementById('googleSignInButton')) {
          window.google.accounts.id.renderButton(
            document.getElementById('googleSignInButton'),
            {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with',
              shape: 'rectangular'
            }
          );
        }
      }
    };
    document.head.appendChild(script);
  };

  // Google Sign-In Handler - FIXED with your exact code
  const handleGoogleSignIn = async (googleData) => {
    setActionLoading(true);
    try {
      console.log('Google sign-in data:', googleData);
      
      const response = await fetch(API_URLS.googleAuth, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: googleData.credential
        })
      });

      const data = await response.json();
      console.log('Backend response:', data);
      
      if (response.ok && data.success) {
        // Store token and user data
        localStorage.setItem('jaysub_token', data.data.token);
        
        // Set user data
        const userData = data.data.user;
        setUser(userData);
        setIsLoggedIn(true);
        setWalletBalance(userData.walletBalance || 0);
        setProfileData({
          name: userData.name,
          email: userData.email,
          phone: userData.phone || ''
        });
        setProfileImageUrl(userData.profileImage || '');
        setReferralCode(userData.referralCode || '');
        
        showNotification('Google sign-in successful!', 'success');
        
        // Fetch initial data
        await fetchNetworks();
        await fetchAirtimeNetworks();
        await fetchReferrals();
        await fetchTransactions();
      } else {
        showNotification(data.message || 'Google sign-in failed', 'error');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      showNotification('Google sign-in failed. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
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

  // Network selection effect - FIXED: Fetch data plans from API
  useEffect(() => {
    if (selectedNetwork && isLoggedIn) {
      console.log('Fetching data plans for network:', selectedNetwork);
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
    } catch (error) {
      console.error('App initialization failed:', error);
      showNotification('Failed to initialize app', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced PWA Implementation
  const initializePWA = async () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA: Running in standalone mode');
    }

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA: Service Worker registered successfully');
      } catch (error) {
        console.error('PWA: Service Worker registration failed:', error);
      }
    }

    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log('PWA: Before install prompt event fired');
      
      setTimeout(() => {
        showPWAInstallPrompt(deferredPrompt);
      }, 5000);
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA: App was installed');
      deferredPrompt = null;
      showNotification('JAYSUB installed successfully!', 'success');
    });
  };

  const showPWAInstallPrompt = (deferredPrompt) => {
    if (deferredPrompt && !localStorage.getItem('pwaPromptDismissed')) {
      const shouldShowPrompt = confirm('Install JAYSUB for better experience! Would you like to install it?');
      
      if (shouldShowPrompt) {
        handlePwaInstall(deferredPrompt);
      } else {
        localStorage.setItem('pwaPromptDismissed', 'true');
      }
    }
  };

  const handlePwaInstall = async (deferredPrompt) => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('PWA: User accepted the install prompt');
          localStorage.setItem('pwaPromptDismissed', 'true');
        }
      } catch (error) {
        console.error('PWA: Install prompt failed:', error);
      }
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
          
          await fetchNetworks();
          await fetchAirtimeNetworks();
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
      if (!token) {
        console.log('No token available for network fetch, using fallback');
        return;
      }

      const response = await fetch(API_URLS.services, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Networks fetched from API:', data.networks);
        if (data.networks && data.networks.length > 0) {
          setNetworks(data.networks);
          setSelectedNetwork(data.networks[0].code);
        }
      } else {
        console.log('Using fallback networks');
      }
    } catch (error) {
      console.error('Failed to fetch networks, using fallback:', error);
    }
  };

  // Enhanced Airtime Networks Fetching
  const fetchAirtimeNetworks = async () => {
    try {
      const token = localStorage.getItem('jaysub_token');
      if (!token) {
        console.log('No token available for airtime networks fetch, using fallback');
        return;
      }

      const response = await fetch(API_URLS.airtimeNetworks, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Airtime networks fetched from API:', data.networks);
        if (data.networks && data.networks.length > 0) {
          setAirtimeNetworks(data.networks);
          setSelectedAirtimeNetwork(data.networks[0].code);
        }
      } else {
        console.log('Using fallback airtime networks');
      }
    } catch (error) {
      console.error('Failed to fetch airtime networks, using fallback:', error);
    }
  };

  // ENHANCED Data Plans Fetching - FIXED to use API properly
  const fetchDataPlans = async (networkCode) => {
    if (!networkCode) {
      console.log('No network code provided for data plans');
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('jaysub_token');
      
      // First try to fetch from API
      if (token) {
        console.log('Fetching data plans from API for network:', networkCode);
        const response = await fetch(API_URLS.dataPlans(networkCode), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Data plans fetched from API for', networkCode, ':', data);
          
          if (data.plans && data.plans.length > 0) {
            console.log('Using API data plans');
            setDataPlans(data.plans);
            return;
          }
        } else {
          console.log('API fetch failed, status:', response.status);
        }
      } else {
        console.log('No token available for data plans fetch');
      }
      
      // If API fails, use fallback
      console.log('Using fallback data plans for', networkCode);
      const fallbackPlans = getFallbackDataPlans(networkCode);
      setDataPlans(fallbackPlans);
      
    } catch (error) {
      console.error('Failed to fetch data plans from API, using fallback:', error);
      const fallbackPlans = getFallbackDataPlans(networkCode);
      setDataPlans(fallbackPlans);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper function for fallback data plans
  const getFallbackDataPlans = (networkCode) => {
    const fallbackPlans = {
      'mtn': [
        { id: 'mtn-1gb', name: '1GB', price: 300, validity: '30 days' },
        { id: 'mtn-2gb', name: '2GB', price: 500, validity: '30 days' },
        { id: 'mtn-5gb', name: '5GB', price: 1000, validity: '30 days' },
        { id: 'mtn-10gb', name: '10GB', price: 2000, validity: '30 days' }
      ],
      'airtel': [
        { id: 'airtel-1gb', name: '1GB', price: 320, validity: '30 days' },
        { id: 'airtel-2gb', name: '2GB', price: 520, validity: '30 days' },
        { id: 'airtel-5gb', name: '5GB', price: 1020, validity: '30 days' },
        { id: 'airtel-10gb', name: '10GB', price: 2020, validity: '30 days' }
      ],
      'glo': [
        { id: 'glo-1gb', name: '1GB', price: 280, validity: '30 days' },
        { id: 'glo-2gb', name: '2GB', price: 480, validity: '30 days' },
        { id: 'glo-5gb', name: '5GB', price: 980, validity: '30 days' },
        { id: 'glo-10gb', name: '10GB', price: 1980, validity: '30 days' }
      ],
      'etisalat': [
        { id: 'etisalat-1gb', name: '1GB', price: 310, validity: '30 days' },
        { id: 'etisalat-2gb', name: '2GB', price: 510, validity: '30 days' },
        { id: 'etisalat-5gb', name: '5GB', price: 1010, validity: '30 days' },
        { id: 'etisalat-10gb', name: '10GB', price: 2010, validity: '30 days' }
      ]
    };
    
    return fallbackPlans[networkCode] || [];
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
        setOtpTimer(300);
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

  // Resend OTP - safer implementation
  const handleResendOtp = async () => {
    if (!otpEmail) {
      showNotification('No email to resend OTP to', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(API_URLS.resendOtp, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: otpEmail })
      });

      // Defensive JSON parse: only try to parse if response has JSON content-type
      const contentType = response.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseErr) {
          console.error('Failed to parse JSON from resendOtp response', parseErr);
          showNotification('Failed to resend OTP (invalid server response)', 'error');
          return;
        }
      } else {
        // fallback: if no JSON body but response.ok treat as success or read text for debugging
        const text = await response.text();
        console.warn('resendOtp returned non-json response:', text);
        if (response.ok) {
          setOtpTimer(300);
          showNotification('New OTP sent to your email!', 'success');
          return;
        } else {
          showNotification('Failed to resend OTP', 'error');
          return;
        }
      }

      if (response.ok && data && data.success) {
        setOtpTimer(300);
        showNotification('New OTP sent to your email!', 'success');
      } else {
        console.error('Resend OTP failed:', data);
        showNotification((data && data.message) || 'Failed to resend OTP', 'error');
      }
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      showNotification('Failed to resend OTP', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle login - FIXED: Added missing password field
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
        
        const description = type === 'data' 
          ? `${getNetworkName(targetNetwork)} Data - ${planName}`
          : `${getNetworkName(targetNetwork)} Airtime`;
          
        addTransaction('debit', amount, description, data.reference);
        showNotification(`Purchase successful for ${targetPhone}!`, 'success');
        
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
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let notificationHTML = `<span>${message}</span>`;
    
    if (actionText && actionCallback) {
      notificationHTML += `<button class="notification-action" onclick="(${actionCallback})()">${actionText}</button>`;
    }
    
    notificationHTML += '<button class="notification-close" onclick="this.parentElement.remove()">×</button>';
    
    notification.innerHTML = notificationHTML;
    
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

  // Login/Signup Form - FIXED: Added missing password field and complete form
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
            <div id="googleSignInButton"></div>
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
              {/* Network Selection - FIXED with immediate fallback */}
              <div className="form-group">
                <label>Select Network Provider</label>
                <select 
                  value={selectedNetwork} 
                  onChange={(e) => {
                    console.log('Network changed to:', e.target.value);
                    setSelectedNetwork(e.target.value);
                    setSelectedPlan(''); // Reset selected plan when network changes
                  }}
                  disabled={actionLoading}
                  className="network-select"
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
                          {plan.validity && <small className="plan-validity">{plan.validity}</small>}
                        </div>
                        {selectedPlan === plan.id && (
                          <button 
                            className="buy-now-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePurchase('data', plan.price, plan.name);
                            }}
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
                    <small>Please select a network to see available plans</small>
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
                <label>Select Network Provider</label>
                <select 
                  value={selectedAirtimeNetwork} 
                  onChange={(e) => setSelectedAirtimeNetwork(e.target.value)}
                  disabled={actionLoading}
                  className="network-select"
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
