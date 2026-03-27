const mongoose = require('mongoose');

const connectDB = async () => {
  // Prefers a standard URI (NOSRV) to bypass restrictive campus/corporate firewalls, 
  // but falls back to the standard Atlas SRV string if needed.
  const uri = process.env.MONGO_URI_NOSRV || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in .env');
    process.exit(1); //Kills the server if no databse
  }
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,  //fails after 5 seconds, to avoid server hanging
    });
    console.log('Connected to MongoDB');

  } catch (err) { //error handling
    console.error('MongoDB connection error:', err && err.message ? err.message : err);
    if (err && err.code === 'ENOTFOUND') {
      console.error('DNS resolution failed for MongoDB host. Check network/DNS settings.');
    } else if (err && err.code === 'ECONNREFUSED') {
      console.error('Connection refused when querying SRV records. Network may block DNS SRV lookups.');
    }
    console.error('Hint: If you are on a restricted network, try from a different network or use a non-SRV connection string.');
    process.exit(1);
  }
};

module.exports = connectDB;
