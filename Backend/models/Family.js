const mongoose = require('mongoose');

const FamilySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    length: 6, // 6-character alphanumeric
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }]
}, { timestamps: true });

module.exports = mongoose.model('Family', FamilySchema);
