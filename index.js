// C:\Users\SoSo\Desktop\user-management-app\server\index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads environment variables from .env file

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();

// --- START CORS CONFIGURATION ---
// IMPORTANT: Replace 'https://YOUR_NETLIFY_APP_URL.netlify.app' with your actual Netlify frontend URL.
// This allows your deployed frontend to communicate with your backend.
const allowedOrigins = [
  'http://localhost:5173', // For local frontend development
  'https://usermanagementapptest.netlify.app', // <--- THIS IS YOUR ACTUAL NETLIFY URL
  // Add other allowed origins if necessary, e.g., 'https://www.yourcustomdomain.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // --- ADDED LOGGING FOR DEBUGGING ---
    console.log('Incoming CORS origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    // --- END LOGGING ---

    // If the origin is not provided (e.g., same-origin requests, file system, Postman), allow it.
    // Otherwise, check if the origin is in our allowed list.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // If origin is not allowed, pass false to deny the request
      callback(new Error(`Not allowed by CORS: Origin "${origin}" is not in the allowed list.`), false);
    }
  },
  credentials: true, // Important if your frontend sends cookies or authorization headers
}));
// --- END CORS CONFIGURATION ---

app.use(express.json()); // Middleware to parse JSON request bodies

// Route handlers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Basic root route for testing API health
app.get('/', (req, res) => {
  res.send('Welcome to the User Management API');
});

// Define the port the server will listen on
// Use process.env.PORT for deployment environments (like Render)
// or fallback to 5000 for local development
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
