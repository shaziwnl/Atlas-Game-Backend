const express = require('express')
const router = express.Router()
const opencage = require('opencage-api-client');

let GlobalGuesses = {}

router.get('/guesses/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  res.status(200).json({guesses: GlobalGuesses[roomId] || []})
})

router.post('/guess', (req, res) => {
    let guesses = req.body.guesses;
    let guess = req.body.guess;
    let prev = req.body.prev;
    let room = req.body.room;
    guess = guess.trim();
    guess = guess.toLowerCase();
    if (guess[0] !== prev[prev.length - 1]) {
        res.status(200).json({ message: `Your guess must start with '${prev[prev.length - 1]}'`, error: true }); //Do not change the control
    } else {
        opencage
          .geocode({ q: `${guess}`, key: process.env.API_KEY })
          .then((data) => {
            // console.log(JSON.stringify(data));
            if (data.status.code === 200 && data.results.length > 0) { //if there is some output
              const place = data.results[0];
              const type = place.components._type;
              if (( (type === 'state' && place.components.state === guess.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(' ')) || (type === 'country' && place.components.country === guess.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(' ')) || (type === 'city' && place.components.city === guess.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(' ')) || guess === "asia" || guess === "europe" || guess === "australia" || guess === "north america" || guess === "south america" || guess === "africa" || guess === "antarctica" )) {
                if (guesses.includes(guess)) {
                  res.status(200).json({ message: "Place has already been guessed", error: true }); //Do not change the control
                } else {
                  prev = guess;
                  guesses.push(guess);
                  GlobalGuesses[room] = guesses;
                  res.status(200).json({ message: "Valid Guess", prev, guesses, error: false }); //we also need to send the control to the second user
                }
              } else {
                res.status(200).json({ message: "You must guess a country/state/city", error: true }); //Do not change the control
              }
              // console.log(place.components._type)
            } else { //if there is no result
              res.status(200).json({ message: "Invalid Guess", error: true});
            }
          })
          .catch((error) => {
            // console.log(JSON.stringify(error));
            console.log('Error', error.message);
            if (error.status.code === 402) {
              console.log('hit free trial daily limit');
              console.log('become a customer: https://opencagedata.com/pricing');
            }
          });
        }
})

module.exports = router