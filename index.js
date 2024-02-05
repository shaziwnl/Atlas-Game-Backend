const bodyParser = require('body-parser');

const express = require('express');
const cors = require('cors');
const app = express();

const port = process.env.PORT || 3001;


app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

// Routes
const auth = require('./routes/auth')
const game = require('./routes/game')
const server = require('./socket')
app.use('/', auth)
app.use('/', game)

// Env
require('dotenv').config();

module.exports = app

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})