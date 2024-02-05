const express = require("express")
const router = express.Router()
const brcypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../data/User')

require('dotenv').config()

const secret = process.env.JWT_SECRET

function generateJWT(username) {
  const payload = {username};
  return jwt.sign(payload, secret, {expiresIn: '2h'});
}


router.post('/signup', async (req, res) => {
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
  
router.post('/login', async (req, res) => {
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

module.exports = router