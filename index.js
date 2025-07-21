// backend/index.js

import dotenv from 'dotenv';
import { connectDB } from './src/databases/db.js';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup error:", err);
  }
};

startServer();
