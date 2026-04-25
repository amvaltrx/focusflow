require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const taskRoutes = require('./src/routes/tasks');
const statsRoutes = require('./src/routes/stats');
const logRoutes = require('./src/routes/logs');
const goalRoutes = require('./src/routes/goals');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/goals', goalRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  const status = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({ 
    status: states[status], 
    database: mongoose.connection.name,
    environment: process.env.NETLIFY ? 'netlify' : 'local'
  });
});

const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const startServer = async () => {
    let mongoUri = process.env.MONGODB_URI;

    try {
        console.log('Attempting to connect to local MongoDB database...');
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
        console.log('Local MongoDB Database connected successfully!');
    } catch (err) {
        console.log('Warning: Local MongoDB is not installed or running!');
        console.log('Automatically spinning up a portable internal database for you...');

        try {
            // Skip memory server on Netlify
            if (process.env.NETLIFY) {
                console.log('Running on Netlify: Fallback database disabled.');
                return;
            }

            // Use a dynamic require to hide this from the Netlify bundler
            const { MongoMemoryServer } = require('mongodb-memory' + '-server');
            const mongod = await MongoMemoryServer.create();
            mongoUri = mongod.getUri();
            await mongoose.connect(mongoUri);
            console.log('Portable InMemory Database firmly hooked into the server!');

            const User = require('./src/models/User');
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('00000', salt);

            let u = await User.findOne({ username: 'amvaltrx' });
            if(!u) {
                await User.create({ username: 'amvaltrx', password: hashedPassword });
                console.log('Solo account amvaltrx created successfully!');
            } else {
                u.password = hashedPassword;
                await u.save();
                console.log('Solo account amvaltrx password synchronized!');
            }
        } catch (fallbackErr) {
            console.error('Failed to boot fallback portable database:', fallbackErr);
        }
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
