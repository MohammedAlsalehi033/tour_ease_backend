import express from 'express';
const cors = require('cors');
const questionRoutes = require('./routes/question/questionRoutes');
const authRoutes = require('./routes/userRoutres');
const commentRoutes = require('./routes/question/comment/commentRoutes');
const transtporationProviderRoutes = require('./routes/user/transportationProviderRoute');
const rideSharingRequestRoutes = require('./routes/rideSharing/requestRoute/reqestsRoute');
const app = express();
import { PrismaClient } from '@prisma/client'

require('dotenv').config();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api', questionRoutes);
app.use('/api', commentRoutes);
app.use('/api', transtporationProviderRoutes);
app.use('/api',rideSharingRequestRoutes );

app.get('/',  (req, res) => {
  res.json({
    
    message: 'Welcome to the Q&A API this is a test for the testing !'});
});





app.post('/verifyJWT', async (req, res) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).send('Unauthorized: No token provided');
  }

  try {
    console.log(idToken)
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { name, email } = req.body;

console.log(idToken)


    res.send({ message: 'User created successfully', uid: uid });
  } catch (error) {
    res.status(403).send('Unauthorized: Invalid token');
  }
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server runniing on port ${PORT}`);
});


