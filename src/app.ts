import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
const cors = require('cors');
const questionRoutes = require('./routes/question/questionRoutes');
const authRoutes = require('./routes/userRoutres');
const commentRoutes = require('./routes/question/comment/commentRoutes');
const transtporationProviderRoutes = require('./routes/user/transportationProviderRoute');
const rideSharingRequestRoutes = require('./routes/rideSharing/requestRoute/reqestsRoute');
const offerRoutes = require('./routes/rideSharing/offerRoute/offerRoute');
const adminRouter = require("./routes/admin/adminRoute");
const adminAnalysisRouter = require("./routes/admin/analysis/analysisRoute");
const transportationBookingRouter = require("./routes/rideSharing/rideBookingRoute/rideBookingRoute");
const rideSharingListingRoutes = require('./routes/rideSharing/listingRoute/listingRoute');
const { createChatRouter } = require("./routes/chat/chatRouter");
import { PrismaClient } from '@prisma/client';
require('dotenv').config();
const { initializeApp } = require('firebase-admin/app');
var admin = require("firebase-admin");

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*", // In production, use specific origin
    methods: ["GET", "POST"],
    credentials: true
  }
});






const connectedUsers = new Map();
io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);
  
  socket.on('user_connected', (userId) => {
    console.log(`User ${userId} connected with socket ${socket.id}`);
    connectedUsers.set(userId, socket.id);
    socket.data.userId = userId;
    
    // Broadcast to other users that this user is now online
    socket.broadcast.emit('user_status_change', { userId, status: 'online' });
  });
  
  socket.on('typing', ({ senderId, receiverId, isTyping }) => {
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { userId: senderId, isTyping });
    }
  });
  
  socket.on('disconnect', () => {
    // Find the user ID associated with this socket
    let disconnectedUserId = null;
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        connectedUsers.delete(userId);
        break;
      }
    }
    
    if (disconnectedUserId) {
      console.log(`User ${disconnectedUserId} disconnected`);
      socket.broadcast.emit('user_status_change', { 
        userId: disconnectedUserId, 
        status: 'offline' 
      });
    }
  });
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api', questionRoutes);
app.use('/api', commentRoutes);
app.use('/api', transtporationProviderRoutes);
app.use('/api', rideSharingRequestRoutes);
app.use('/api', rideSharingListingRoutes);
app.use('/api', offerRoutes);
app.use('/api', adminRouter);
app.use('/api', transportationBookingRouter);


app.use('/api', createChatRouter(io, connectedUsers)); 
app.use('/api/admin', adminAnalysisRouter);

app.get('/test-socket', (req, res) => {
  res.sendFile(__dirname + '/test-chat.html');
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API'
  });
});



app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// Start the server using the HTTP server, not the Express app
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server is running`);
  console.log(`Test the socket connection at http://localhost:${PORT}/test-socket`);
});