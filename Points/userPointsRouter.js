const express = require('express');
const router = express.Router();
const postgres = require('../Database/db');
const pointController = require('./pointController');

// Get the points of the user
router.get('/user_points', pointController.points_Control);

module.exports = router;