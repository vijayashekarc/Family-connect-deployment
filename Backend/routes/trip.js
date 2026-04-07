const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');

// @route GET /api/trip/family/:familyGroupId
// @desc Get all trips for a family
router.get('/family/:familyGroupId', async (req, res) => {
  try {
    const trips = await Trip.find({ familyGroupId: req.params.familyGroupId }).sort({ date: 1 });
    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route POST /api/trip
// @desc Create a trip
router.post('/', async (req, res) => {
  try {
    const { title, date, familyGroupId, vehicleDetails, schedule } = req.body;
    
    const newTrip = new Trip({
      title,
      date,
      familyGroupId,
      vehicleDetails: vehicleDetails || {},
      schedule: schedule || []
    });

    await newTrip.save();
    res.status(201).json(newTrip);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route PUT /api/trip/:id
// @desc Update trip (e.g. updating schedule or vehicle)
router.put('/:id', async (req, res) => {
  try {
    const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route DELETE /api/trip/:id
// @desc Delete trip
router.delete('/:id', async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
