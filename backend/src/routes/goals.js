const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Get all goals
router.get('/', auth, async (req, res) => {
    try {
        const goals = await Goal.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(goals);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Create a goal
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, targetDate, color } = req.body;
        const newGoal = new Goal({
            userId: req.user.id, title, description, targetDate, color
        });
        const goal = await newGoal.save();
        res.json(goal);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Update a goal
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, description, targetDate, color, status } = req.body;
        let goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });
        if (goal.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        goal = await Goal.findByIdAndUpdate(req.params.id, { $set: { title, description, targetDate, color, status } }, { new: true });
        res.json(goal);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Delete a goal
router.delete('/:id', auth, async (req, res) => {
    try {
        let goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });
        if (goal.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        // Unlink tasks
        await Task.updateMany({ goalId: req.params.id }, { $unset: { goalId: "" } });
        await Goal.findByIdAndDelete(req.params.id);
        res.json({ message: 'Goal removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
