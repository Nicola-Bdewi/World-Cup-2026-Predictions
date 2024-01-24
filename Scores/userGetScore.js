const express = require('express');
const routerScore = express.Router();
const postgres = require('../Database/db');

routerScore.get('/get-scores', (req, res) => {
    postgres('soccermatches').select('teama_score', 'teamb_score')
    .where({ user_id: req.session.userId })
    .then(scores => {
      res.json(scores);
    })
    .catch(err => {
      console.log(err);
      res.status(500).send('An error occurred');
    });
  });

module.exports = routerScore;