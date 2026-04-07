const express = require('express');
const router = express.Router();
const Family = require('../models/Family');
const User = require('../models/User');

// Helper to generate 6-char alphanumeric code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @route POST /api/family/create
// @desc Create a new family group
router.post('/create', async (req, res) => {
  try {
    const { name, userId } = req.body; // user making the request

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Ensure generate unique code
    let inviteCode = generateInviteCode();
    while (await Family.findOne({ inviteCode })) {
      inviteCode = generateInviteCode();
    }

    const newFamily = new Family({
      name,
      inviteCode,
      members: [userId]
    });

    await newFamily.save();

    // Update user
    user.familyGroupId = newFamily._id;
    await user.save();

    res.status(201).json({ family: newFamily, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// @route POST /api/family/join
// @desc Join an existing family group
router.post('/join', async (req, res) => {
  try {
    const { inviteCode, userId } = req.body;

    const family = await Family.findOne({ inviteCode });
    if (!family) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Add user if not already a member
    if (!family.members.includes(userId)) {
      family.members.push(userId);
      await family.save();
    }

    user.familyGroupId = family._id;
    await user.save();

    // Populate members string for response later if needed
    const populatedFamily = await Family.findById(family._id).populate('members', 'name phone');

    res.json({ family: populatedFamily, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// @route GET /api/family/:id
// @desc Get family details
router.get('/:id', async (req, res) => {
  try {
    const family = await Family.findById(req.params.id).populate('members', 'name phone currentLocation');
    if (!family) return res.status(404).json({ message: 'Family not found' });
    res.json(family);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;
