const bodyParser = require('body-parser');
const opencage = require('opencage-api-client');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const brcypt = require('bcrypt');
const mongoose = require('mongoose')
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const port = process.env.PORT || 3001;

require('dotenv').config();

app.use(bodyParser.json());
app.use(express.json());
app.use(cors());



const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: String,
  hashedPassword: String
});
const User = mongoose.model('User', userSchema);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://atlas-game.netlify.app',
    methods: ['GET', 'POST']
  }
});

io.on("connection", (socket) => {
  console.log('user connected', socket.id);

  socket.on('send_message', (data) => {
    socket.to(data.room).emit('receive_message', {guesses: data.guesses, guess: data.guess})
    
  });
  

  socket.on('join_room', (room) => {
    let roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
    if (roomSize < 2) {
      socket.join(room);
      console.log('user joined with id', socket.id, 'joined room', room);
      console.log(roomSize);
    } else {
      console.log('room is full!');
    }
  });


  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });

  socket.on('resign', (room) => {
    socket.to(room).emit('lost', room)
  })


});

mongoose.connect(`mongodb+srv://Shaz101:${process.env.DB_PASSWORD}@atlas-game-db.x8p2fc3.mongodb.net/app`, { useNewUrlParser: true, useUnifiedTopology: true, dbName: "app" });

const secret = process.env.JWT_SECRET

function generateJWT(username) {
  const payload = {username};
  return jwt.sign(payload, secret, {expiresIn: '2h'});
}


app.post('/signup', async (req, res) => {
  const { firstName, lastName, username, password } = req.body;  
  let user = await User.findOne({username});
  if (user) {
    console.log('Username already exists');
    res.status(200).json({ message: 'Username already exists' });
  } else {
    const hashedPassword = await brcypt.hash(password, 10);
    const newUser = new User({ firstName, lastName, username, hashedPassword });
    await newUser.save();
    console.log('User registered successfully');
    res.status(200).json({ message: 'User registered successfully!' });
  }
})


app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let user = await User.findOne({username});
  if (user) {
    const passwordMatch = await brcypt.compare(password, user.hashedPassword);
    if (passwordMatch) {
      const token = generateJWT(username);
      res.status(200).json({ message: 'Logged in', errorAlert: false, token});
    } else {
      res.status(200).json({ message: 'Incorrect Password', errorAlert: true });
    }
  } else {
    res.status(200).json({ message: 'User not found', errorAlert: true });
  }
})


app.post('/guess', (req, res) => {
    let guesses = req.body.guesses;
    let guess = req.body.guess;
    let prev = req.body.prev;
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


server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})