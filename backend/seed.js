require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

const seedUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todo-productivity-app');
        console.log('MongoDB Connected');

        const username = '0000';
        const password = '0000';

        let user = await User.findOne({ username });
        if (user) {
            console.log('User 0000 already exists. Updating password to 0000...');
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();
            console.log('Password updated successfully!');
        } else {
            console.log('Creating new user 0000...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user = new User({ username, password: hashedPassword });
            await user.save();
            console.log('User 0000 (with password 0000) created successfully!');
        }
        process.exit(0);
    } catch (err) {
        console.error('Failed to connect to DB or create user:', err.message);
        process.exit(1);
    }
}

seedUser();
