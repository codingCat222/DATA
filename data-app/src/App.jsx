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

  // API URLs
  const API_BASE_URL = 'https://data-dqrk.onrender.com';
  const API_URLS = {
    login: `${API_BASE_URL}/api/auth/login`,
    signup: `${API_BASE_URL}/api/auth/signup`,
    verifyOtp: `${API_BASE_URL}/api/auth/verify-otp`,
    resendOtp: `${API_BASE_URL}/api/auth/resend-otp`,
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
      checkDarkMode();
      await checkAuthStatus();
    } catch (error) {
      console.error('App initialization failed:', error);
      showNotification('Failed to initialize app', 'error');
    } finally {
      setIsLoading(false);
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

  // Data Plans Fetching
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

          {/* Simple Google Sign-in placeholder */}
          <div className="social-auth">
            <button 
              type="button" 
              className="google-btn"
              onClick={() => showNotification('Google Sign-In coming soon!', 'info')}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: 'white',
                color: '#333',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '16px'
              }}
            >
              <span>🔐</span>
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
                {actionLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Main Dashboard Layout
  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>JAYSUB</h1>
            <span className="greeting">{greeting}, {user?.name}</span>
          </div>
          
          <div className="header-actions">
            <button 
              className="theme-toggle"
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            
            <div className="user-menu">
              <div className="user-avatar">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Profile" />
                ) : (
                  <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <span className="user-name">{user?.name}</span>
            </div>
            
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar */}
        <nav className="sidebar">
          <ul className="nav-menu">
            <li>
              <button 
                className={currentView === 'dashboard' ? 'active' : ''}
                onClick={() => setCurrentView('dashboard')}
              >
                📊 Dashboard
              </button>
            </li>
            <li>
              <button 
                className={currentView === 'data' ? 'active' : ''}
                onClick={() => setCurrentView('data')}
              >
                📱 Buy Data
              </button>
            </li>
            <li>
              <button 
                className={currentView === 'airtime' ? 'active' : ''}
                onClick={() => setCurrentView('airtime')}
              >
                📞 Buy Airtime
              </button>
            </li>
            <li>
              <button 
                className={currentView === 'transactions' ? 'active' : ''}
                onClick={() => setCurrentView('transactions')}
              >
                💳 Transactions
              </button>
            </li>
            <li>
              <button 
                className={currentView === 'profile' ? 'active' : ''}
                onClick={() => setCurrentView('profile')}
              >
                👤 Profile
              </button>
            </li>
            <li>
              <button 
                className={currentView === 'referrals' ? 'active' : ''}
                onClick={() => setCurrentView('referrals')}
              >
                👥 Referrals
              </button>
            </li>
          </ul>
        </nav>

        {/* Content Area */}
        <div className="content-area">
          {actionLoading && (
            <div className="action-preloader">
              <div className="spinner"></div>
              <span>Processing...</span>
            </div>
          )}

          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="dashboard-view">
              <div className="wallet-card">
                <h3>Wallet Balance</h3>
                <div className="balance">₦{walletBalance.toLocaleString()}</div>
                <div className="wallet-actions">
                  <button 
                    className="fund-btn"
                    onClick={() => setShowFundModal(true)}
                  >
                    Fund Wallet
                  </button>
                  <button 
                    className="refresh-btn"
                    onClick={checkAuthStatus}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-grid">
                  <button 
                    className="action-btn"
                    onClick={() => setCurrentView('data')}
                  >
                    <span>📱</span>
                    Buy Data
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => setCurrentView('airtime')}
                  >
                    <span>📞</span>
                    Buy Airtime
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => setCurrentView('transactions')}
                  >
                    <span>💳</span>
                    Transactions
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => setCurrentView('referrals')}
                  >
                    <span>👥</span>
                    Referrals
                  </button>
                </div>
              </div>

              {/* Recent Transactions Preview */}
              <div className="recent-transactions">
                <h3>Recent Transactions</h3>
                {transactions.length > 0 ? (
                  <div className="transactions-list">
                    {transactions.slice(0, 5).map(transaction => (
                      <div key={transaction.id} className="transaction-item">
                        <div className="transaction-info">
                          <span className="description">{transaction.description}</span>
                          <span className="date">{transaction.date}</span>
                        </div>
                        <div className={`amount ${transaction.type}`}>
                          {transaction.type === 'debit' ? '-' : '+'}₦{transaction.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No transactions yet</p>
                )}
              </div>
            </div>
          )}

          {/* Data Purchase View */}
          {currentView === 'data' && (
            <div className="data-view">
              <h2>Buy Data</h2>
              <div className="purchase-form">
                <div className="form-group">
                  <label>Select Network</label>
                  <select 
                    value={selectedNetwork} 
                    onChange={(e) => setSelectedNetwork(e.target.value)}
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
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={actionLoading}
                  />
                </div>

                <div className="form-group">
                  <label>Select Data Plan</label>
                  {actionLoading ? (
                    <div className="loading-plans">Loading plans...</div>
                  ) : dataPlans.length > 0 ? (
                    <div className="data-plans-grid">
                      {dataPlans.map(plan => (
                        <div 
                          key={plan.id}
                          className={`data-plan ${selectedPlan === plan.id ? 'selected' : ''}`}
                          onClick={() => setSelectedPlan(plan.id)}
                        >
                          <div className="plan-name">{plan.name}</div>
                          <div className="plan-price">₦{plan.price}</div>
                          <div className="plan-validity">{plan.validity}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-plans">No data plans available for this network</div>
                  )}
                </div>

                {selectedPlan && (
                  <button
                    className="purchase-btn"
                    onClick={() => {
                      const plan = dataPlans.find(p => p.id === selectedPlan);
                      if (plan) {
                        handlePurchase('data', plan.price, plan.name);
                      }
                    }}
                    disabled={actionLoading || !phoneNumber}
                  >
                    {actionLoading ? 'Processing...' : `Buy Data - ₦${dataPlans.find(p => p.id === selectedPlan)?.price}`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Airtime Purchase View */}
          {currentView === 'airtime' && (
            <div className="airtime-view">
              <h2>Buy Airtime</h2>
              <div className="purchase-form">
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
                    placeholder="Enter phone number"
                    value={airtimePhoneNumber}
                    onChange={(e) => setAirtimePhoneNumber(e.target.value)}
                    disabled={actionLoading}
                  />
                </div>

                <div className="form-group">
                  <label>Amount (₦)</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={airtimeAmount}
                    onChange={(e) => setAirtimeAmount(e.target.value)}
                    disabled={actionLoading}
                    min="50"
                  />
                </div>

                <button
                  className="purchase-btn"
                  onClick={() => handlePurchase('airtime', parseInt(airtimeAmount))}
                  disabled={actionLoading || !airtimePhoneNumber || !airtimeAmount || airtimeAmount < 50}
                >
                  {actionLoading ? 'Processing...' : `Buy Airtime - ₦${airtimeAmount}`}
                </button>
              </div>
            </div>
          )}

          {/* Transactions View */}
          {currentView === 'transactions' && (
            <div className="transactions-view">
              <h2>Transaction History</h2>
              <div className="transactions-list">
                {transactions.length > 0 ? (
                  transactions.map(transaction => (
                    <div key={transaction.id} className="transaction-item detailed">
                      <div className="transaction-main">
                        <div className="transaction-info">
                          <span className="description">{transaction.description}</span>
                          <span className="reference">Ref: {transaction.reference}</span>
                        </div>
                        <div className={`amount ${transaction.type}`}>
                          {transaction.type === 'debit' ? '-' : '+'}₦{transaction.amount}
                        </div>
                      </div>
                      <div className="transaction-meta">
                        <span className="date">{transaction.date}</span>
                        <span className={`status ${transaction.status}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-transactions">
                    <p>No transactions found</p>
                    <button 
                      className="refresh-btn"
                      onClick={fetchTransactions}
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile View */}
          {currentView === 'profile' && (
            <div className="profile-view">
              <h2>Profile Settings</h2>
              
              <div className="profile-section">
                <div className="profile-image-section">
                  <div className="profile-image">
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Profile" />
                    ) : (
                      <div className="profile-initial">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="image-actions">
                    <input
                      type="file"
                      id="profileImage"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="profileImage" className="upload-btn">
                      Change Photo
                    </label>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="profile-form">
                  <h3>Personal Information</h3>
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
                    <label>Email</label>
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
                    {actionLoading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>

                <form onSubmit={handlePasswordChange} className="password-form">
                  <h3>Change Password</h3>
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

                <div className="preferences-section">
                  <h3>Preferences</h3>
                  <div className="preference-item">
                    <span>Dark Mode</span>
                    <button 
                      className={`toggle-btn ${darkMode ? 'active' : ''}`}
                      onClick={toggleDarkMode}
                    >
                      {darkMode ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="preference-item">
                    <span>Notifications</span>
                    <button 
                      className={`toggle-btn ${notificationsEnabled ? 'active' : ''}`}
                      onClick={toggleNotifications}
                    >
                      {notificationsEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Referrals View */}
          {currentView === 'referrals' && (
            <div className="referrals-view">
              <h2>Referral Program</h2>
              
              <div className="referral-stats">
                <div className="stat-card">
                  <h3>Your Referral Code</h3>
                  <div className="referral-code">
                    {referralCode || 'Loading...'}
                  </div>
                  <button 
                    className="copy-btn"
                    onClick={() => {
                      if (referralCode) {
                        navigator.clipboard.writeText(referralCode);
                        showNotification('Referral code copied!', 'success');
                      }
                    }}
                  >
                    Copy Code
                  </button>
                </div>

                <div className="stat-card">
                  <h3>Total Referrals</h3>
                  <div className="stat-number">{referrals.length}</div>
                  <p>People you've referred</p>
                </div>
              </div>

              <div className="referral-list">
                <h3>Your Referrals</h3>
                {referrals.length > 0 ? (
                  <div className="referrals-grid">
                    {referrals.map((referral, index) => (
                      <div key={index} className="referral-item">
                        <div className="referral-name">{referral.name}</div>
                        <div className="referral-email">{referral.email}</div>
                        <div className="referral-date">
                          Joined: {new Date(referral.joinDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-referrals">
                    <p>No referrals yet</p>
                    <p>Share your referral code with friends to earn rewards!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fund Wallet Modal */}
      {showFundModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Fund Wallet</h3>
              <button 
                className="close-btn"
                onClick={() => setShowFundModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Amount (₦)</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  min="100"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowFundModal(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn"
                onClick={() => {
                  if (fundAmount && fundAmount >= 100) {
                    handleFundWallet(parseInt(fundAmount));
                    setShowFundModal(false);
                  } else {
                    showNotification('Please enter a valid amount (minimum ₦100)', 'error');
                  }
                }}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
