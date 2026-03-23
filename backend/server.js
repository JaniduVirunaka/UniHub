const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect("mongodb://janiduvirunkadev_db_user:VvrfpGrxci1Ng9uZ@ac-wapxcue-shard-00-00.el2gav7.mongodb.net:27017,ac-wapxcue-shard-00-01.el2gav7.mongodb.net:27017,ac-wapxcue-shard-00-02.el2gav7.mongodb.net:27017/?ssl=true&replicaSet=atlas-dfketm-shard-0&authSource=admin&appName=Cluster0ITPM")
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Routes
const clubRouter = require('./routes/clubRoutes');
const authRouter = require('./routes/authRoutes');
app.use('/api/clubs', clubRouter);
app.use('/api/auth', authRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));