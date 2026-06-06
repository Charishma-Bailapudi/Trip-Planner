const express = require('express');
const router = express.Router();
const {
  createTrip,
  getTrips,
  getTripById,
  deleteTrip
} = require('../controllers/tripController');

const { protect } = require('../middleware/authMiddleware');

// Define routes for /api/trips
router.use(protect);
router.route('/')
  .post(createTrip)
  .get(getTrips);

router.route('/:id')
  .get(getTripById)
  .delete(deleteTrip);

module.exports = router;
