const express = require('express');
const routerReadonly = express.Router();
const postgres = require('../Database/db');
const ARController = require('./AddReadonlyController');

routerReadonly.get('/check-readonly', ARController.AddReadonlyController);

module.exports = {routerReadonly};