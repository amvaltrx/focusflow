const serverless = require('serverless-http');
const mongoose = require('mongoose');
const app = require('../server'); // Go up to backend/server.js
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

let isConnected = false;

const seedUser = async () => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('00000', salt);
        
        let u = await User.findOne({ username: 'amvaltrx' });
        if (!u) {
            await User.create({ username: 'amvaltrx', password: hashedPassword });
            console.log('Seeded solo account: amvaltrx');
        } else {
            u.password = hashedPassword;
            await u.save();
        }
    } catch (err) {
        console.error('Seeding error:', err);
    }
};

const connectDB = async () => {
    if (isConnected) return;
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        isConnected = true;
        await seedUser(); // Seed every time we connect (serverless is ephemeral)
    } catch (err) {
        console.error('DB Connection error:', err);
    }
};

const handler = serverless(app);

module.exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    await connectDB();
    return await handler(event, context);
};
