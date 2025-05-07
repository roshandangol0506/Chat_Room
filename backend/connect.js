const mongoose = require("mongoose");

async function connectTomongoDB(url) {
  return mongoose.connect(url);
}

module.exports = { connectTomongoDB };
