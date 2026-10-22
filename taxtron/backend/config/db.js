const mongoose = require('mongoose');
let connection;
async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!connection) {
    connection = mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
    }).catch(error => { connection = null; throw error; });
  }
  return connection;
}
module.exports = connectDB;
