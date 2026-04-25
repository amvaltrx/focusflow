const express = require('express');
const router = express.Router();
const UserLog = require('../models/UserLog');
const auth = require('../middleware/auth');

// Get today's logs for the user
router.get('/today', auth, async (req, res) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0,0,0,0);
        
        const logs = await UserLog.find({
            userId: req.user.id,
            timestamp: { $gte: startOfToday }
        }).sort({ timestamp: -1 });
        
        res.json(logs);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Create a new log
router.post('/', auth, async (req, res) => {
    try {
        const { mood, energy, note } = req.body;
        const newLog = new UserLog({
            userId: req.user.id,
            mood,
            energy,
            note,
            timestamp: new Date()
        });
        await newLog.save();
        res.json(newLog);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
