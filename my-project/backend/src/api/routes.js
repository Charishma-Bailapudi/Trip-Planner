const express = require('express');
const router = express.Router();
const {
  createTrip,
  getTrips,
  getTripById,
  deleteTrip
} = require('../controllers/tripController');

// Define routes for /api/trips
router.route('/')
  .post(createTrip)
  .get(getTrips);

router.route('/:id')
  .get(getTripById)
  .delete(deleteTrip);

module.exports = router;
