const express = require('express');
const routerLogin = express.Router();
const postgres = require('../Database/db');
const bcrypt = require('bcryptjs');

routerLogin.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

routerLogin.post('/login.html', (req,res)=>{
    const {lcontact_email, lpassw} = req.body;
    postgres.select('email', 'hash').from('login')
    .where('email', '=', lcontact_email)
    .then(users => {
      const isValid = bcrypt.compareSync(lpassw, users[0].hash);
      if(isValid){
        postgres('Users').select('contact_email','user_id')
        .where('contact_email','=', lcontact_email)
        .then(currentUser => {
          req.session.userId  = currentUser[0].user_id;
          res.redirect('/');
        })
      } else {
        res.status(400).json('Wrong credentials');
      }
    })
    .catch(err => {
      console.log(err);
      res.status(400).json({ error: 'An error occurred' }); // Send an error response
    });

});

module.exports = routerLogin;