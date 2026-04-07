require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Strict CORS configuration
const allowedOrigins = [
  process.env.VITE_API_URL, 
  'http://localhost:5173', // Vite default local
  'http://localhost:3000'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/familytrip')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Basic Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a specific family room
  socket.on('joinFamilyRoom', (familyGroupId) => {
    socket.join(familyGroupId);
    console.log(`Socket ${socket.id} joined room: ${familyGroupId}`);
  });

  // Handle location updates
  socket.on('updateLocation', (data) => {
    // data should include: familyGroupId, userId, coordinates [lng, lat]
    if (data.familyGroupId) {
      socket.to(data.familyGroupId).emit('locationUpdated', {
        userId: data.userId,
        coordinates: data.coordinates,
      });
    }
  });

  // Handle emergency SOS
  socket.on('triggerSOS', (data) => {
    if (data.familyGroupId) {
      // Instantly broadcast emergency to all members in the family room
      io.to(data.familyGroupId).emit('emergencySOS', {
        triggeredBy: data.userId,
        message: 'EMERGENCY SOS TRIGGERED!',
        timestamp: new Date()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Basic route for testing Ping
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/family', require('./routes/family'));
app.use('/api/user', require('./routes/user'));
app.use('/api/trip', require('./routes/trip'));
app.use('/api/ai', require('./routes/ai'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
