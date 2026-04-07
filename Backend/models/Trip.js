const mongoose = require('mongoose');

const StopSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true, // e.g. "09:00 AM" or Date objects
  },
  activity: {
    type: String,
    required: true,
  },
  locationName: {
    type: String,
    required: true,
  }
});

const TripSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  familyGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
  },
  vehicleDetails: {
    makeModel: {
      type: String,
      default: '',
    },
    licensePlate: {
      type: String,
      default: '',
    }
  },
  schedule: [StopSchema]
}, { timestamps: true });

module.exports = mongoose.model('Trip', TripSchema);
