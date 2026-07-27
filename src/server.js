require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// DB connection start karo turant — local aur serverless dono mein
connectDB().catch((error) => {
  console.error('Database connection failed:', error);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1); // local dev mein DB fail ho to turant band karo
  }
});

// Sirf local development mein port pe listen karo — Vercel apna handler khud banata hai
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;