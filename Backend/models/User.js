const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  familyGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],    // 'location.type' must be 'Point'
      default: 'Point',
    },
    coordinates: {
      type: [Number],     // [longitude, latitude]
      default: [0, 0],
    }
  }
}, { timestamps: true });

// Index for geospatial queries if needed in the future
UserSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('User', UserSchema);
