const mongoose = require('mongoose');

const fcmTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer', // Tham chiếu đến model Customer
    required: false // Có thể null cho anonymous users
  },
  phone: {
    type: String,
    required: true, // RẤT QUAN TRỌNG: số điện thoại để map với đơn hàng
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  platform: {
    type: String,
    enum: ['ios', 'android', 'web', 'unknown'],
    default: 'unknown'
  },
  deviceInfo: {
    userAgent: String,
    model: String,
    version: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  topics: [{
    type: String // Danh sách các topics mà token này subscribe
  }],
  isAuthenticated: {
    type: Boolean,
    default: false
  },
  authenticatedAt: {
    type: Date,
    required: false
  },
  notificationPreferences: {
    general: { type: Boolean, default: true },
    orders: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    system: { type: Boolean, default: true },
    authenticated: { type: Boolean, default: true }
  },
  preferencesUpdatedAt: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index để tìm kiếm nhanh
fcmTokenSchema.index({ userId: 1 });
fcmTokenSchema.index({ phone: 1 });
fcmTokenSchema.index({ token: 1 });
fcmTokenSchema.index({ platform: 1 });
fcmTokenSchema.index({ isActive: 1 });
fcmTokenSchema.index({ isAuthenticated: 1 });
fcmTokenSchema.index({ phone: 1, isAuthenticated: 1 });
fcmTokenSchema.index({ phone: 1, isActive: 1, isAuthenticated: 1 });

// Middleware để update updatedAt
fcmTokenSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method để lưu hoặc update token
fcmTokenSchema.statics.saveToken = async function(tokenData) {
  try {
    const existingToken = await this.findOne({ token: tokenData.token });
    
    if (existingToken) {
      // Update existing token
      existingToken.userId = tokenData.userId || existingToken.userId;
      existingToken.phone = tokenData.phone || existingToken.phone;
      existingToken.platform = tokenData.platform || existingToken.platform;
      existingToken.deviceInfo = tokenData.deviceInfo || existingToken.deviceInfo;
      existingToken.isActive = true;
      existingToken.lastUsed = new Date();
      
      // Update authentication status
      if (tokenData.isAuthenticated !== undefined) {
        existingToken.isAuthenticated = tokenData.isAuthenticated;
        if (tokenData.isAuthenticated) {
          existingToken.authenticatedAt = tokenData.authenticatedAt || new Date();
        }
      }
      
      // Update notification preferences if provided
      if (tokenData.notificationPreferences) {
        existingToken.notificationPreferences = {
          ...existingToken.notificationPreferences,
          ...tokenData.notificationPreferences
        };
        existingToken.preferencesUpdatedAt = new Date();
      }
      
      return await existingToken.save();
    } else {
      // Create new token
      const newTokenData = {
        ...tokenData,
        notificationPreferences: tokenData.notificationPreferences || {
          general: true,
          orders: true,
          promotions: true,
          system: true,
          authenticated: true
        }
      };
      return await this.create(newTokenData);
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
    throw error;
  }
};

// Static method để lấy tokens của user
fcmTokenSchema.statics.getUserTokens = async function(userId) {
  return await this.find({ 
    userId: userId, 
    isActive: true 
  }).select('token platform');
};

// Static method để lấy tokens theo phone
fcmTokenSchema.statics.getTokensByPhone = async function(phone) {
  return await this.find({ 
    phone: phone, 
    isActive: true 
  }).select('token platform');
};

// Static method để lấy authenticated tokens theo phone
fcmTokenSchema.statics.getAuthenticatedTokensByPhone = async function(phone) {
  return await this.find({ 
    phone: phone, 
    isActive: true,
    isAuthenticated: true
  }).select('token platform notificationPreferences');
};

// Static method để lấy tất cả active tokens
fcmTokenSchema.statics.getAllActiveTokens = async function() {
  return await this.find({ 
    isActive: true 
  }).select('token');
};

// Static method để deactivate token
fcmTokenSchema.statics.deactivateToken = async function(token) {
  return await this.updateOne(
    { token: token },
    { isActive: false }
  );
};

// Static method để clean up old tokens
fcmTokenSchema.statics.cleanupOldTokens = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return await this.deleteMany({
    lastUsed: { $lt: cutoffDate },
    isActive: false
  });
};

module.exports = mongoose.model('FCMToken', fcmTokenSchema);
