require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Initialize server
const startServer = async () => {
  // 1. Connect to Database first
  await connectDB();

  // 2. Start HTTP server ONLY after DB connection succeeds
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();
