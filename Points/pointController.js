const express = require('express');
const postgres = require('../Database/db');

const points_Control = (req, res) => {
    postgres('user_points')
      .select('points')
      .where({ user_id: req.session.userId })
      .then(result => {
        if (result.length > 0) {
          res.json({ points: result[0].points });
          postgres.raw('REFRESH MATERIALIZED VIEW user_points;');
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      });
  }

 module.exports = {points_Control};