require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { requestLogger, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectDB();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Base Health Check Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AI Trip Planner API is online and functional',
    version: '1.0.0'
  });
});

// Register API Routes
app.use('/api/trips', require('./api/routes'));

// Centralized Error Handler Middleware (MUST be registered last)
app.use(errorHandler);

// Start listening for connections
app.listen(PORT, () => {
  console.log(`[Server] Server running in development mode on port ${PORT}`);
});
