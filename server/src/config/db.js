const mongoose = require('mongoose');
const dbConfig = require('./config');

const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;

module.exports = db;
/*
const connectDB = async () => {
  try {
    console.log('MongoDB Connecting...');
    await mongoose.connect(db, {
      useNewUrlParser: true
    });
    console.log('MongoDB Connected...');
  } catch (error) {
    console.log('Error: ' + error.message);
    process.exit(1);
  }
};

module.exports = connectDB;*/
