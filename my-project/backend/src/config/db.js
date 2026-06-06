const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trip-planner';
  
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database] Connection error: ${error.message}`);
    process.exit(1);
  }
};

// Listen to connection event changes for observability
mongoose.connection.on('connected', () => {
  console.log('[Database] Mongoose default connection open');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database] Mongoose default connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('[Database] Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('[Database] Mongoose default connection disconnected through app termination');
  process.exit(0);
});

module.exports = connectDB;
