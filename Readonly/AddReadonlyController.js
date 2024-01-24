const postgres = require('../Database/db');

const AddReadonlyController = (req, res) => {
    postgres('soccermatches').select('user_id', 'teama_score', 'teamb_score')
    .then(scores => {
      for(let score of scores) {
        if(score.teama_score != ' ' && score.teamb_score != ' ' && score.user_id === req.session.userId){
          res.send('NotEmptyScores');
          return;
        }
      }
      res.send('emptyScores');
    })
    .catch(err => {
      console.log(err);
      res.status(500).send('An error occurred');
    });
  };

module.exports = {AddReadonlyController};