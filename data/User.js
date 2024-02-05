const mongoose = require('mongoose')
require('dotenv').config()

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    username: String,
    hashedPassword: String
  });
const User = mongoose.model('User', userSchema);

mongoose.connect(`mongodb+srv://Shaz101:${process.env.DB_PASSWORD}@atlas-game-db.x8p2fc3.mongodb.net/app`, { useNewUrlParser: true, useUnifiedTopology: true, dbName: "app" });

module.exports = User