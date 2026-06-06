const express = require('express');
const router = express.Router();
const {
  createTrip,
  getTrips,
  getTripById,
  deleteTrip,
  selectTransitOption
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

router.route('/:id/transit/:transitId/select')
  .put(selectTransitOption);

module.exports = router;
