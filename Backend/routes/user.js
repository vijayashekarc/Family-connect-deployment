const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route PUT /api/user/location
// @desc Update user location in DB
router.put('/location', async (req, res) => {
  try {
    const { userId, coordinates } = req.body;
    
    if (!userId || !coordinates) {
      return res.status(400).json({ message: 'Missing data' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.currentLocation = {
      type: 'Point',
      coordinates: coordinates, // [lng, lat]
    };

    await user.save();
    res.json(user.currentLocation);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
