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
  console.log('A user connected:', socket.id);
  
  socket.on('user_connected', (userId) => {
    connectedUsers.set(userId, socket.id);
    
    socket.broadcast.emit('user_status_change', { userId, status: 'online' });
  });
  
  socket.on('typing', ({ senderId, receiverId, isTyping }) => {
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { userId: senderId, isTyping });
    }
  });
  
  socket.on('disconnect', () => {
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

// Middleware
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
app.use('/api', createChatRouter(io)); // Pass io to chat router
app.use('/api/admin', adminAnalysisRouter);

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome Aqeel'
  });
});

app.post('/verifyJWT', async (req, res) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).send('Unauthorized: No token provided');
  }
  try {
    console.log(idToken);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { name, email } = req.body;
    console.log(idToken);
    res.send({ message: 'User created successfully', uid: uid });
  } catch (error) {
    res.status(403).send('Unauthorized: Invalid token');
  }
});

// Error handling middleware
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
});