const express = require('express'); 
const knex = require('knex');
const postgres = require('./Database/db');
const path = require('path');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const bcrypt = require('bcryptjs');
const userPointsRouter = require('./Points/userPointsRouter');
const userScoreRouter = require('./Scores/userGetScore');
const userLogin = require('./Login/login');
const addReadonly = require('./Readonly/formAddReadonly');

const app = express();

// Converting 1 hour to milliseconds
const oneHour = 1000 * 60 * 60;

//session middleware
app.use(sessions({
    secret: "fhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneHour },
    resave: false
}));

// cookie parser middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// middleware to use css files. 
app.use(express.static(__dirname));

 
app.get('/',(req,res) => {
  if(req.session.userId){
    res.sendFile(path.join(__dirname, '/index.html'));
  } else {
    res.sendFile(path.join(__dirname, './Login/login.html'));
  }
});

app.get('/index.html',(req, res)=>{
    res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});


// Logout 
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if(err) {
      return console.log(err);
    }
    res.redirect('/');
  });
});

// Change login to logout when session exists
app.get('/check-session', (req, res) => {
  if(req.session.userId){
      res.send('Logged In');
  } else {
      res.send('Logged Out');
  }
});

// Make the form readonly when submitted
app.use(addReadonly.routerReadonly);

// Fetching results from database 
app.use(userScoreRouter);

// Get the points of the user
app.use(userPointsRouter);

// Add green tick to winners after the match results are entered. 
app.get('/results-after', (req, res) => {
  postgres('admin')
    .select('teama_id', 'teamb_id', 'winner')
    .then(data => res.json(data))
    .catch(error => res.status(500).json({ error }));
});

app.listen(3000);

//Login
app.use(userLogin);

app.post('/register.html', (req,res)=>{
    const {contact_email, passw, first_name, last_name} = req.body;
    const hash = bcrypt.hashSync(passw, 8);
    postgres.transaction(trx => {
      trx.insert({
        hash: hash, 
        email: contact_email
      })
      .into('login')
      .returning('email')
      .then (loginemail => {
       return trx('Users')
       .returning('*')
       .insert({
        contact_email: contact_email,
        first_name: first_name, 
        last_name:last_name,
        joined: new Date()
        }).then(user => {
            res.json(user); // Send the inserted user as a response
        })
       
      })
      .then(trx.commit)
      .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('Unable to register'))
});

app.post('/submit', (req, res) => {
    const userId = req.session.userId;  
    const teamAScore1 = req.body.teamA_score1;
    const teamBScore1 = req.body.teamB_score1;
    const teamAScore2 = req.body.teamA_score2;
    const teamBScore2 = req.body.teamB_score2;

    postgres('soccermatches').insert([
        {user_id: req.session.userId, teama_id: 1, teamb_id: 2, teama_score: teamAScore1, teamb_score: teamBScore1},
        {user_id: req.session.userId, teama_id: 3, teamb_id: 4, teama_score: teamAScore2, teamb_score: teamBScore2}
    ])
    .then(() => {
        res.send('Form submitted successfully!');
    })
    .catch(error => {
        console.log(error);
        res.status(500).send('Error submitting form');
    });
});


module.exports = { app, postgres };



// const {Client} = require('pg'); 

// const client = new Client({
//     host: "localhost",
//     user: "postgres",
//     port: 5432,
//     password: "",
//     database: "postgres"
// }); 

// client.connect();

// client.query( `Select * FROM "Users"`, (err,res)=>{
//     if(!err){
//         console.log(res.rows);
//     } else {
//         console.log(err.message);
//     }
//     client.end();
// }
// )

// SELECT 
//     a.teama_id, a.teamb_id, a.user_id,
//     CASE 
//         WHEN a.teama_score > a.teamb_score THEN a.teama_id
//         WHEN a.teama_score < a.teamb_score THEN a.teamb_id
//         WHEN a.teama_score = a.teamb_score THEN 0
//         ELSE -1
//     END as winner
// FROM 
//     "admin" a
// JOIN 
//     soccermatches s ON a.teama_id = s.teama_id AND a.teamb_id = s.teamb_id AND a.user_id = s.user_id;




// CREATE MATERIALIZED VIEW user_points AS
// SELECT user_id,
//   SUM(
//     CASE
//       WHEN teama_score = (SELECT teama_score FROM admin WHERE admin.teama_id = soccermatches.teama_id AND admin.teamb_id = soccermatches.teamb_id)
//        AND teamb_score = (SELECT teamb_score FROM admin WHERE admin.teama_id = soccermatches.teama_id AND admin.teamb_id = soccermatches.teamb_id)
//       THEN 3
//       WHEN (SELECT winner FROM "admin" WHERE "admin".teama_id = soccermatches.teama_id AND "admin".teamb_id = soccermatches.teamb_id) =  
//       teama_score OR
// 	  (SELECT winner FROM "admin" WHERE "admin".teama_id = soccermatches.teama_id AND "admin".teamb_id = soccermatches.teamb_id)=
// 	  teamb_score
//       THEN 1
//       ELSE 0
//     END
//   ) AS points
// FROM soccermatches
// GROUP BY user_id;
