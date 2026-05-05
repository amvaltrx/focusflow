const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');
const auth = require('../middleware/auth');

// Get all tasks for user
router.get('/', auth, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const pendingDailyTasks = await Task.find({
        userId: req.user.id,
        isDaily: true,
        status: 'pending',
        createdDate: { $lt: todayStart }
    });

    if (pendingDailyTasks.length > 0) {
        for (let task of pendingDailyTasks) {
            let currentDay = new Date(task.createdDate);
            currentDay.setHours(0, 0, 0, 0);

            // Mark original as missed
            task.status = 'missed';
            await task.save();

            // Fill gaps if any
            currentDay.setDate(currentDay.getDate() + 1);
            while (currentDay < todayStart) {
                const missedTask = new Task({
                    userId: task.userId,
                    goalId: task.goalId,
                    title: task.title,
                    description: task.description,
                    allocatedTime: task.allocatedTime,
                    isAllDay: task.isAllDay,
                    isDaily: true,
                    priority: task.priority,
                    category: task.category,
                    status: 'missed',
                    createdDate: new Date(currentDay)
                });
                await missedTask.save();
                currentDay.setDate(currentDay.getDate() + 1);
            }

            // Spawn today's task
            const nextTask = new Task({
                userId: task.userId,
                goalId: task.goalId,
                title: task.title,
                description: task.description,
                allocatedTime: task.allocatedTime,
                isAllDay: task.isAllDay,
                isDaily: true,
                priority: task.priority,
                category: task.category,
                subtasks: task.subtasks.map(st => ({ title: st.title, isCompleted: false }))
            });
            await nextTask.save();
        }
    }

    const tasks = await Task.find({ userId: req.user.id }).sort({ createdDate: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Create a task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, allocatedTime, isAllDay, isDaily, priority, category, deadline, subtasks } = req.body;
    const newTask = new Task({
      userId: req.user.id, title, description, allocatedTime, isAllDay, isDaily, priority, category, deadline, subtasks
    });
    const task = await newTask.save();
    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Update a task
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, allocatedTime, isAllDay, isDaily, actualTimeSpent, priority, category, deadline, subtasks } = req.body;
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
    
    const updateData = { title, description, allocatedTime, isAllDay, isDaily, actualTimeSpent, priority, category, deadline, subtasks };
    // Remove undefined fields so they don't overwrite if not provided
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    task = await Task.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Complete a task
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    task.status = 'completed';
    task.completedDate = new Date();
    await task.save();

    if (task.isDaily) {
      const nextTask = new Task({
        userId: task.userId,
        goalId: task.goalId,
        title: task.title,
        description: task.description,
        allocatedTime: task.allocatedTime,
        isAllDay: task.isAllDay,
        isDaily: true,
        priority: task.priority,
        category: task.category,
        subtasks: task.subtasks.map(st => ({ title: st.title, isCompleted: false }))
      });
      if (task.deadline) {
         const newDeadline = new Date(task.deadline);
         newDeadline.setDate(newDeadline.getDate() + 1);
         nextTask.deadline = newDeadline;
      }
      await nextTask.save();
    }

    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Delete a task
router.delete('/:id', auth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
    
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Log a Focus Session
router.post('/focus-session', auth, async (req, res) => {
  try {
    const { taskId, startTime, endTime, duration } = req.body;
    const newSession = new FocusSession({
      userId: req.user.id,
      taskId,
      startTime,
      endTime,
      duration
    });
    await newSession.save();
    res.json(newSession);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// GET Smart Schedule Suggestion
router.get('/smart-schedule', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Analyze Behavior (Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const history = await Task.find({
            userId,
            status: 'completed',
            completedDate: { $gte: thirtyDaysAgo }
        }).select('completedDate');

        const sessionHistory = await FocusSession.find({
            userId,
            createdAt: { $gte: thirtyDaysAgo }
        }).select('startTime');

        // Aggregate by hour
        const hourStats = new Array(24).fill(0);
        history.forEach(t => {
            const hour = new Date(t.completedDate).getHours();
            hourStats[hour] += 2; // Completion is a strong signal
        });
        sessionHistory.forEach(s => {
            const hour = new Date(s.startTime).getHours();
            hourStats[hour] += 1; // Focus is a good signal
        });

        // Determine Peak & Low energy hours
        // Simplification: Peak = Top 4 hours, Low = Bottom 4 hours (within 8am-8pm window)
        const workHours = [];
        for(let i=8; i<=20; i++) workHours.push({ hour: i, score: hourStats[i] });
        
        workHours.sort((a, b) => b.score - a.score);
        const peakHours = workHours.slice(0, 4).map(h => h.hour);
        const lowEnergyHours = workHours.slice(-4).map(h => h.hour);

        // 2. Fetch & Sort Pending Tasks
        const tasks = await Task.find({ userId, status: 'pending' });
        
        // Sorting strategy: Overdue > High Priority > Medium > Low
        const now = new Date();
        const sortedTasks = [...tasks].sort((a, b) => {
            const aOverdue = a.deadline && new Date(a.deadline) < now;
            const bOverdue = b.deadline && new Date(b.deadline) < now;
            if (aOverdue && !bOverdue) return -1;
            if (!aOverdue && bOverdue) return 1;

            const priorityMap = { high: 3, medium: 2, low: 1 };
            if (priorityMap[b.priority] !== priorityMap[a.priority]) {
                return priorityMap[b.priority] - priorityMap[a.priority];
            }
            return (b.allocatedTime || 0) - (a.allocatedTime || 0);
        });

        // 3. Build Schedule
        const suggestedSchedule = [];
        let currentHour = Math.max(new Date().getHours() + 1, 9); // Start next hour or 9am
        if (currentHour > 18) currentHour = 9; // If late, plan for tomorrow 9am

        sortedTasks.forEach(task => {
            let hourType = 'normal';
            if (peakHours.includes(currentHour)) hourType = 'peak';
            if (lowEnergyHours.includes(currentHour)) hourType = 'low';

            // Smart Assignment:
            // - If it's a peak hour and we have high priority tasks, use them.
            // - If it's low energy, try to find a 'low' priority task or shorter task.
            
            // For simplicity in this v1, we just assign in order but label the blocks
            suggestedSchedule.push({
                task,
                scheduledHour: currentHour,
                hourType,
                recommendation: hourType === 'peak' ? 'Deep Work recommended' : hourType === 'low' ? 'Light task recommended' : 'Productive window'
            });
            
            currentHour = (currentHour + 1) % 24;
            if (currentHour > 21) currentHour = 9; // Wrap to next morning
        });

        res.json({
            suggestedSchedule,
            analysis: {
                peakHours,
                lowEnergyHours
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST Postpone a task
router.post('/:id/postpone', auth, async (req, res) => {
    try {
        let task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        
        const oldDeadline = task.deadline;
        const newDeadline = new Date(oldDeadline || new Date());
        newDeadline.setDate(newDeadline.getDate() + 1); // Postpone by 1 day by default

        task.postponedCount = (task.postponedCount || 0) + 1;
        task.rescheduleHistory.push({
            previousDeadline: oldDeadline,
            newDeadline: newDeadline,
            reason: 'Manual Postpone',
            timestamp: new Date()
        });
        task.deadline = newDeadline;
        
        await task.save();
        res.json(task);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// GET Procrastination Insights
router.get('/procrastination/insights', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const tasks = await Task.find({ userId, postponedCount: { $gt: 0 } });
        
        if (tasks.length === 0) {
            return res.json({ insights: ["You're doing great! No patterns of procrastination detected yet."] });
        }

        const insights = [];
        
        // Pattern 1: Time-of-day procrastination
        const postponeHours = tasks.flatMap(t => t.rescheduleHistory.map(h => new Date(h.timestamp).getHours()));
        const hourCounts = {};
        postponeHours.forEach(h => hourCounts[h] = (hourCounts[h] || 0) + 1);
        
        const peakPostponeHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b, 0);
        
        if (peakPostponeHour >= 12 && peakPostponeHour <= 17) {
            insights.push("You tend to delay tasks in the afternoon. Consider scheduling shorter, high-dopamine tasks during this time.");
        } else if (peakPostponeHour >= 18) {
            insights.push("Late evening seems to be your procrastination peak. Try wrapping up your main work by 6 PM.");
        }

        // Pattern 2: Difficulty-based procrastination
        const highPriorityPostponed = tasks.filter(t => t.priority === 'high').length;
        if (highPriorityPostponed > tasks.length / 2) {
            insights.push("You often postpone high-priority tasks. We recommend using 'Micro-Deadlines' (15-min focus blocks) to overcome the initial friction.");
        }

        // Pattern 3: Habitual delay
        const heavyPostponers = tasks.filter(t => t.postponedCount > 3);
        if (heavyPostponers.length > 0) {
            insights.push(`Specific tasks like "${heavyPostponers[0].title}" have been moved ${heavyPostponers[0].postponedCount} times. Try breaking this into 3 smaller subtasks.`);
        }

        res.json({
            insights,
            flaggedTasks: heavyPostponers.map(t => ({ id: t._id, title: t.title, count: t.postponedCount }))
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
