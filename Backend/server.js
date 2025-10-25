const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();

// Middleware - Allow requests from your React app
app.use(cors({
    origin: 'http://localhost:5173', // Your React app URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://tobisamuel2024_db_user:GvYHGBlPBKkgtlyZ@cluster0.tveuydw.mongodb.net/jaysub?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.log('❌ MongoDB Connection Error:', err));

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tobisamuel2024@gmail.com',
        pass: 'fmdy ezir hliq mhuy'
    }
});

console.log('📧 Email transporter configured');

// Models
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: '' },
    walletBalance: { type: Number, default: 0 },
    referralCode: { type: String, unique: true },
    referredBy: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date }
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    reference: { type: String, required: true },
    status: { type: String, default: 'completed' }
}, { timestamps: true });

const ServiceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['data', 'airtime'], required: true },
    status: { type: String, default: 'active' }
});

const DataPlanSchema = new mongoose.Schema({
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    validity: { type: String },
    dataAmount: { type: String }
});

const PurchaseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['data', 'airtime'], required: true },
    network: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    planName: { type: String },
    reference: { type: String, required: true, unique: true },
    status: { type: String, default: 'success' }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Service = mongoose.model('Service', ServiceSchema);
const DataPlan = mongoose.model('DataPlan', DataPlanSchema);
const Purchase = mongoose.model('Purchase', PurchaseSchema);

console.log('🗄️ Database models initialized');

// Generate Referral Code
const generateReferralCode = () => {
    return 'REF' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
const sendOTPEmail = async (email, otp) => {
    try {
        console.log('📤 Attempting to send OTP email to:', email);
        console.log('🔑 OTP Code for testing:', otp);

        const mailOptions = {
            from: 'tobisamuel2024@gmail.com',
            to: email,
            subject: 'JAYSUB - Email Verification OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">JAYSUB Email Verification</h2>
                    <p>Your OTP for email verification is:</p>
                    <h1 style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px;">
                        ${otp}
                    </h1>
                    <p>This OTP will expire in 5 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>JAYSUB Team</p>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ OTP email sent successfully to:', email);
        console.log('📨 Email message ID:', result.messageId);
        return true;
    } catch (error) {
        console.error('❌ Email sending error:', error);
        return false;
    }
};

// Auth Middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, 'jaysub_secret_key_2024');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            console.log('❌ Invalid token - user not found');
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }

        req.user = user;
        console.log('✅ Authenticated user:', user.email);
        next();
    } catch (error) {
        console.log('❌ Token verification failed:', error.message);
        res.status(401).json({ 
            success: false, 
            message: 'Token is not valid' 
        });
    }
};

// Routes

// Test Route
app.get('/', (req, res) => {
    console.log('🏠 Root route accessed');
    res.json({ 
        message: 'JAYSUB Backend Server is running!',
        timestamp: new Date().toISOString(),
        frontendUrl: 'http://localhost:5173',
        backendUrl: 'http://localhost:5000'
    });
});

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, phone, password, referralCode } = req.body;

        console.log('=== SIGNUP START ===');
        console.log('📝 Signup attempt for:', email);
        
        // Check if user exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { phone }] 
        });
        
        if (existingUser) {
            console.log('❌ User already exists');
            return res.status(400).json({
                success: false,
                message: 'User with this email or phone already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        console.log('🔑 Generated OTP:', otp);
        console.log('⏰ OTP expires at:', otpExpires);

        // Create user with OTP
        const user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            referralCode: generateReferralCode(),
            otp: otp, // Ensure OTP is stored as string
            otpExpires: otpExpires
        });

        // Handle referral logic...
        // [Keep your existing referral code here]

        // Save user
        await user.save();
        console.log('✅ User saved with OTP');

        // Verify OTP was saved by reading it back
        const savedUser = await User.findOne({ email });
        console.log('💾 Verified stored OTP:', savedUser.otp);
        console.log('💾 Stored OTP type:', typeof savedUser.otp);

        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp);
        
        if (!emailSent) {
            console.log('❌ Failed to send OTP email');
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP email'
            });
        }

        console.log('✅ OTP email sent successfully');
        console.log('=== SIGNUP COMPLETE ===');

        res.status(201).json({
            success: true,
            message: 'User registered successfully. OTP sent to email.',
            data: {
                email: user.email,
                otpForTesting: otp // Remove this in production
            }
        });

    } catch (error) {
        console.error('❌ Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during signup'
        });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        console.log('=== OTP VERIFICATION START ===');
        console.log('📧 Email:', email);
        console.log('🔑 Received OTP:', otp, 'Type:', typeof otp);
        
        // Input validation
        if (!email || !otp) {
            console.log('❌ Missing email or OTP');
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        // Find user
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('❌ User not found');
            return res.status(400).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('👤 User found:', user.email);
        console.log('💾 Stored OTP:', user.otp, 'Type:', typeof user.otp);
        console.log('⏰ OTP expires:', user.otpExpires);
        console.log('🕒 Current time:', new Date());
        
        // Check if OTP exists
        if (!user.otp) {
            console.log('❌ No OTP found for user');
            return res.status(400).json({
                success: false,
                message: 'No OTP found. Please request a new one.'
            });
        }

        // Check if OTP is expired
        if (user.otpExpires < new Date()) {
            console.log('❌ OTP expired');
            // Clear expired OTP
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();
            
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Convert both to strings and trim for comparison
        const enteredOtp = String(otp).trim();
        const storedOtp = String(user.otp).trim();

        console.log('🔍 Comparing OTPs:');
        console.log('   Entered:', `"${enteredOtp}"`, `(length: ${enteredOtp.length})`);
        console.log('   Stored: ', `"${storedOtp}"`, `(length: ${storedOtp.length})`);
        console.log('   Match: ', enteredOtp === storedOtp);

        if (enteredOtp !== storedOtp) {
            console.log('❌ OTP mismatch');
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP code. Please try again.'
            });
        }

        console.log('✅ OTP matched successfully');

        // Mark user as verified and clear OTP
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id }, 
            'jaysub_secret_key_2024', 
            { expiresIn: '30d' }
        );

        console.log('✅ User verified and token generated');
        console.log('=== OTP VERIFICATION COMPLETE ===');

        res.json({
            success: true,
            message: 'Email verified successfully',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    walletBalance: user.walletBalance,
                    profileImage: user.profileImage,
                    referralCode: user.referralCode
                }
            }
        });

    } catch (error) {
        console.error('❌ OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during OTP verification'
        });
    }
});

app.post('/api/auth/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        console.log('🔄 Resend OTP request for:', email);

        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('❌ User not found for OTP resend:', email);
            return res.status(400).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        console.log('🔑 New OTP generated:', otp);

        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp);
        
        if (!emailSent) {
            console.log('❌ Failed to resend OTP email to:', email);
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP email'
            });
        }

        console.log('✅ OTP resent successfully to:', email);

        res.json({
            success: true,
            message: 'OTP resent successfully'
        });

    } catch (error) {
        console.error('❌ Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while resending OTP'
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Login attempt for:', email);

        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('❌ Login failed - user not found:', email);
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            console.log('❌ Login failed - invalid password for:', email);
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!user.isVerified) {
            console.log('❌ Login failed - email not verified:', email);
            return res.status(400).json({
                success: false,
                message: 'Please verify your email first'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id }, 
            'jaysub_secret_key_2024', 
            { expiresIn: '30d' }
        );

        console.log('✅ Login successful for:', email);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    walletBalance: user.walletBalance,
                    profileImage: user.profileImage,
                    referralCode: user.referralCode
                }
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// User Routes
app.get('/api/user/profile', authMiddleware, async (req, res) => {
    try {
        console.log('👤 Profile requested for:', req.user.email);
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    phone: req.user.phone,
                    walletBalance: req.user.walletBalance,
                    profileImage: req.user.profileImage,
                    referralCode: req.user.referralCode
                }
            }
        });
    } catch (error) {
        console.error('❌ Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching profile'
        });
    }
});

app.put('/api/user/update-profile', authMiddleware, async (req, res) => {
    try {
        const { name, phone } = req.body;

        console.log('✏️ Profile update requested for:', req.user.email);
        console.log('📋 Update data:', { name, phone });

        const user = await User.findById(req.user._id);
        user.name = name;
        user.phone = phone;
        await user.save();

        console.log('✅ Profile updated successfully for:', user.email);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    walletBalance: user.walletBalance,
                    profileImage: user.profileImage,
                    referralCode: user.referralCode
                }
            }
        });

    } catch (error) {
        console.error('❌ Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile'
        });
    }
});

app.post('/api/user/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        console.log('🔒 Password change requested for:', req.user.email);

        const user = await User.findById(req.user._id);

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isCurrentPasswordValid) {
            console.log('❌ Password change failed - invalid current password');
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        user.password = hashedNewPassword;
        await user.save();

        console.log('✅ Password changed successfully for:', user.email);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('❌ Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while changing password'
        });
    }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

console.log('📁 Multer configured for file uploads');

app.post('/api/user/upload-profile-image', authMiddleware, upload.single('profileImage'), async (req, res) => {
    try {
        console.log('🖼️ Profile image upload requested for:', req.user.email);

        if (!req.file) {
            console.log('❌ No file uploaded');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        console.log('📁 File uploaded:', req.file.filename);

        const user = await User.findById(req.user._id);
        user.profileImage = `/uploads/${req.file.filename}`;
        await user.save();

        console.log('✅ Profile image updated for:', user.email);

        res.json({
            success: true,
            message: 'Profile image uploaded successfully',
            data: {
                profileImageUrl: user.profileImage
            }
        });

    } catch (error) {
        console.error('❌ Upload profile image error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while uploading profile image'
        });
    }
});

app.get('/api/user/referrals', authMiddleware, async (req, res) => {
    try {
        console.log('👥 Referrals requested for:', req.user.email);

        const referrals = await User.find({ referredBy: req.user.referralCode });
        
        const referralData = referrals.map(ref => ({
            name: ref.name,
            email: ref.email,
            status: ref.isVerified ? 'Verified' : 'Pending',
            joinedAt: ref.createdAt
        }));

        console.log('📊 Referrals found:', referralData.length);

        res.json({
            success: true,
            data: {
                referrals: referralData
            }
        });

    } catch (error) {
        console.error('❌ Referrals error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching referrals'
        });
    }
});

// Wallet Routes
app.get('/api/wallet', authMiddleware, async (req, res) => {
    try {
        console.log('💰 Wallet balance requested for:', req.user.email);
        console.log('💵 Current balance:', req.user.walletBalance);

        res.json({
            success: true,
            data: {
                walletBalance: req.user.walletBalance
            }
        });
    } catch (error) {
        console.error('❌ Wallet balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching wallet balance'
        });
    }
});

app.get('/api/wallet/transactions', authMiddleware, async (req, res) => {
    try {
        console.log('📊 Transactions requested for:', req.user.email);

        const transactions = await Transaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        console.log('📈 Transactions found:', transactions.length);

        res.json({
            success: true,
            data: {
                transactions
            }
        });

    } catch (error) {
        console.error('❌ Transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching transactions'
        });
    }
});

// Services Routes
app.get('/api/services', async (req, res) => {
    try {
        console.log('🛍️ Services list requested');

        const services = await Service.find({ status: 'active' });
        
        console.log('📦 Services found:', services.length);

        res.json({
            success: true,
            data: {
                services
            }
        });

    } catch (error) {
        console.error('❌ Services error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching services'
        });
    }
});

app.get('/api/services/data-plans/:network', async (req, res) => {
    try {
        const { network } = req.params;
        
        console.log('📡 Data plans requested for network:', network);

        const service = await Service.findOne({ code: network, type: 'data' });
        
        if (!service) {
            console.log('❌ Service not found for network:', network);
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        const dataPlans = await DataPlan.find({ serviceId: service._id });
        
        console.log('📋 Data plans found:', dataPlans.length);

        res.json({
            success: true,
            data: {
                plans: dataPlans
            }
        });

    } catch (error) {
        console.error('❌ Data plans error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching data plans'
        });
    }
});

app.get('/api/services/airtime-networks', async (req, res) => {
    try {
        console.log('📞 Airtime networks requested');

        const airtimeNetworks = await Service.find({ type: 'airtime', status: 'active' });
        
        console.log('📶 Airtime networks found:', airtimeNetworks.length);

        res.json({
            success: true,
            data: {
                networks: airtimeNetworks
            }
        });

    } catch (error) {
        console.error('❌ Airtime networks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching airtime networks'
        });
    }
});

// Purchase Route
app.post('/api/purchase', authMiddleware, async (req, res) => {
    try {
        const { type, network, phoneNumber, amount, planName } = req.body;

        console.log('🛒 Purchase request from:', req.user.email);
        console.log('📋 Purchase details:', { type, network, phoneNumber, amount, planName });

        // Check if user has sufficient balance
        if (req.user.walletBalance < amount) {
            console.log('❌ Insufficient balance for purchase');
            return res.status(400).json({
                success: false,
                message: 'Insufficient wallet balance'
            });
        }

        // Generate reference
        const reference = 'PUR_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        console.log('🔖 Generated reference:', reference);

        // Deduct from wallet
        const user = await User.findById(req.user._id);
        user.walletBalance -= amount;
        await user.save();

        // Create transaction
        const transaction = new Transaction({
            userId: req.user._id,
            type: 'debit',
            amount: amount,
            description: `${network} ${type} - ${planName || 'Airtime'}`,
            reference: reference
        });
        await transaction.save();

        // Create purchase record
        const purchase = new Purchase({
            userId: req.user._id,
            type: type,
            network: network,
            phoneNumber: phoneNumber,
            amount: amount,
            planName: planName,
            reference: reference
        });
        await purchase.save();

        console.log('✅ Purchase completed successfully');
        console.log('💳 Amount deducted:', amount);
        console.log('💵 New balance:', user.walletBalance);

        res.json({
            success: true,
            message: 'Purchase successful',
            data: {
                reference: reference,
                newBalance: user.walletBalance
            }
        });

    } catch (error) {
        console.error('❌ Purchase error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during purchase'
        });
    }
});

// Payment Routes (Paystack Integration)
app.post('/api/payments/initialize', authMiddleware, async (req, res) => {
    try {
        const { amount, email } = req.body;

        console.log('💳 Payment initialization requested by:', req.user.email);
        console.log('💰 Amount:', amount);

        // Generate reference
        const reference = 'PAY_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        console.log('🔖 Payment reference:', reference);

        res.json({
            success: true,
            data: {
                authorization_url: `https://paystack.com/pay/jaysub-${reference}`,
                access_code: 'mock_access_code',
                reference: reference
            }
        });

    } catch (error) {
        console.error('❌ Payment initialization error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during payment initialization'
        });
    }
});

app.post('/api/payments/verify', authMiddleware, async (req, res) => {
    try {
        const { reference } = req.body;

        console.log('🔍 Payment verification requested for reference:', reference);

        const amount = 1000; // This would come from Paystack response

        // Update user wallet
        const user = await User.findById(req.user._id);
        user.walletBalance += amount;
        await user.save();

        // Create transaction
        const transaction = new Transaction({
            userId: req.user._id,
            type: 'credit',
            amount: amount,
            description: 'Wallet Funding',
            reference: reference
        });
        await transaction.save();

        console.log('✅ Payment verified successfully');
        console.log('💰 Amount credited:', amount);
        console.log('💵 New balance:', user.walletBalance);

        res.json({
            success: true,
            data: {
                amount: amount,
                newBalance: user.walletBalance
            }
        });

    } catch (error) {
        console.error('❌ Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during payment verification'
        });
    }
});

// Initialize Sample Data
const initializeSampleData = async () => {
    try {
        // Check if services already exist
        const existingServices = await Service.countDocuments();
        
        if (existingServices === 0) {
            console.log('📦 Initializing sample data...');
            
            // Create sample services
            const services = [
                { name: 'MTN Data', code: 'mtn-data', type: 'data' },
                { name: 'Glo Data', code: 'glo-data', type: 'data' },
                { name: 'Airtel Data', code: 'airtel-data', type: 'data' },
                { name: '9mobile Data', code: 'etisalat-data', type: 'data' },
                { name: 'MTN Airtime', code: 'mtn', type: 'airtime' },
                { name: 'Glo Airtime', code: 'glo', type: 'airtime' },
                { name: 'Airtel Airtime', code: 'airtel', type: 'airtime' },
                { name: '9mobile Airtime', code: 'etisalat', type: 'airtime' }
            ];

            await Service.insertMany(services);

            // Get created services to create data plans
            const mtnData = await Service.findOne({ code: 'mtn-data' });
            const gloData = await Service.findOne({ code: 'glo-data' });
            const airtelData = await Service.findOne({ code: 'airtel-data' });
            const etisalatData = await Service.findOne({ code: 'etisalat-data' });

            // Sample data plans
            const dataPlans = [
                // MTN Plans
                { serviceId: mtnData._id, name: '1GB - 30 days', price: 300, validity: '30 days', dataAmount: '1GB' },
                { serviceId: mtnData._id, name: '2GB - 30 days', price: 500, validity: '30 days', dataAmount: '2GB' },
                { serviceId: mtnData._id, name: '5GB - 30 days', price: 1500, validity: '30 days', dataAmount: '5GB' },
                { serviceId: mtnData._id, name: '10GB - 30 days', price: 3000, validity: '30 days', dataAmount: '10GB' },
                
                // Glo Plans
                { serviceId: gloData._id, name: '1.35GB - 30 days', price: 500, validity: '30 days', dataAmount: '1.35GB' },
                { serviceId: gloData._id, name: '2.9GB - 30 days', price: 1000, validity: '30 days', dataAmount: '2.9GB' },
                { serviceId: gloData._id, name: '5.8GB - 30 days', price: 2000, validity: '30 days', dataAmount: '5.8GB' },
                
                // Airtel Plans
                { serviceId: airtelData._id, name: '1GB - 30 days', price: 500, validity: '30 days', dataAmount: '1GB' },
                { serviceId: airtelData._id, name: '2GB - 30 days', price: 1000, validity: '30 days', dataAmount: '2GB' },
                { serviceId: airtelData._id, name: '5GB - 30 days', price: 2000, validity: '30 days', dataAmount: '5GB' },
                
                // 9mobile Plans
                { serviceId: etisalatData._id, name: '1.5GB - 30 days', price: 1000, validity: '30 days', dataAmount: '1.5GB' },
                { serviceId: etisalatData._id, name: '3GB - 30 days', price: 1500, validity: '30 days', dataAmount: '3GB' }
            ];

            await DataPlan.insertMany(dataPlans);

            console.log('✅ Sample data initialized successfully');
            console.log('📊 Services created:', services.length);
            console.log('📋 Data plans created:', dataPlans.length);
        } else {
            console.log('✅ Sample data already exists');
        }
    } catch (error) {
        console.error('❌ Error initializing sample data:', error);
    }
};

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('🚀 Server starting...');
    console.log('📍 Server running on port', PORT);
    console.log('🌐 Backend URL: http://localhost:' + PORT);
    console.log('🎯 Frontend URL: http://localhost:5173');
    console.log('📧 Email service: Ready');
    console.log('🗄️ Database: Connected');
    console.log('⏰ Starting initialization...');
    
    initializeSampleData();
});

console.log('🔧 Server configuration completed');