const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const UserLog = require('../models/UserLog');
const FocusSession = require('../models/FocusSession');
const auth = require('../middleware/auth');

router.get('/dashboard', auth, async (req, res) => {
  try {
    const clientMidnightStr = req.query.clientMidnight;
    let todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    if (clientMidnightStr) {
        todayStart = new Date(clientMidnightStr);
    }
    
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const activeTasksCount = await Task.countDocuments({
      userId: req.user.id,
      status: 'pending'
    });

    const completedTodayCount = await Task.countDocuments({
      userId: req.user.id,
      status: 'completed',
      completedDate: { $gte: todayStart, $lt: todayEnd }
    });

    const totalNeededToday = activeTasksCount + completedTodayCount;
    const dailyPercentage = totalNeededToday === 0 ? 0 : Math.round((completedTodayCount / totalNeededToday) * 100);

    let streak = 0;
    const thirtyDaysAgo = new Date(todayStart);
    thirtyDaysAgo.setDate(todayStart.getDate() - 30);
    
    const recentlyCompletedAndCreated = await Task.find({
      userId: req.user.id,
      $or: [
        { completedDate: { $gte: thirtyDaysAgo } },
        { createdDate: { $gte: thirtyDaysAgo } }
      ]
    });
    
    for (let i = 0; i < 30; i++) {
        let checkDayStart = new Date(todayStart.getTime() - i * 86400000);
        let checkDayEnd = new Date(checkDayStart.getTime() + 86400000 - 1);

        let createdOnDay = recentlyCompletedAndCreated.filter(t => t.createdDate >= checkDayStart && t.createdDate <= checkDayEnd).length;
        let completedOnDay = recentlyCompletedAndCreated.filter(t => t.status === 'completed' && t.completedDate >= checkDayStart && t.completedDate <= checkDayEnd).length;

        let totalForDay = createdOnDay + completedOnDay; 
        
        if (totalForDay === 0) {
            // Edge case: Days with no tasks. Skipping to not maliciously break streak per requirements.
            continue;
        }

        let dayPercentage = completedOnDay / totalForDay;
        if (dayPercentage >= 0.5) {
            streak++;
        } else {
            if (i > 0) break; // Break streak if not today.
        }
    }

    // Time Analytics
    const totalFocusSecondsToday = recentlyCompletedAndCreated
        .filter(t => t.updatedAt >= todayStart && t.updatedAt <= todayEnd)
        .reduce((sum, t) => sum + (t.actualTimeSpent || 0), 0);
    
    const weeklyTimeData = [];
    for(let i=6; i>=0; i--) {
        let dStart = new Date(todayStart.getTime() - i * 86400000);
        let dEnd = new Date(dStart.getTime() + 86400000 - 1);
        
        let daySeconds = recentlyCompletedAndCreated
            .filter(t => t.updatedAt >= dStart && t.updatedAt <= dEnd)
            .reduce((sum, t) => sum + (t.actualTimeSpent || 0), 0);
        
        weeklyTimeData.push(Math.round(daySeconds / 60));
    }

    const weeklyData = [];
    const labels = [];
    for(let i=6; i>=0; i--) {
        let dStart = new Date(todayStart.getTime() - i * 86400000);
        let dEnd = new Date(dStart.getTime() + 86400000 - 1);

        let dayCompleted = recentlyCompletedAndCreated.filter(t => t.status === 'completed' && t.completedDate >= dStart && t.completedDate <= dEnd).length;
        labels.push(dStart.toLocaleDateString('en-US', { weekday: 'short' }));
        weeklyData.push(dayCompleted);
    }

    res.json({
        dailyPercentage,
        streak,
        weeklyData, // Task count trends
        weeklyTimeData, // Minute trends
        labels,
        activeTasksCount,
        completedTodayCount,
        totalFocusMinutesToday: Math.round(totalFocusSecondsToday / 60)
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// GET Wellness-Productivity Correlation
router.get('/wellness-correlation', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await UserLog.find({
      userId,
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: 1 });

    const tasks = await Task.find({
      userId,
      status: 'completed',
      completedDate: { $gte: thirtyDaysAgo }
    });

    if (logs.length === 0 || tasks.length === 0) {
      return res.json({ pattern: "Not enough data yet. Log your mood and energy daily!" });
    }

    // Analysis: Morning vs Afternoon productivity vs Energy
    const morningTasks = tasks.filter(t => new Date(t.completedDate).getHours() < 12).length;
    const afternoonTasks = tasks.filter(t => new Date(t.completedDate).getHours() >= 12).length;

    const morningEnergy = logs.filter(l => new Date(l.timestamp).getHours() < 12);
    const avgMorningEnergy = morningEnergy.length > 0 
      ? morningEnergy.reduce((sum, l) => sum + l.energy, 0) / morningEnergy.length 
      : 0;

    let pattern = "We're still analyzing your patterns.";
    if (avgMorningEnergy > 3.5 && morningTasks > afternoonTasks) {
      pattern = "You're most productive when your energy is high in the morning. Leverage this for Deep Work!";
    } else if (afternoonTasks > morningTasks) {
      pattern = "You seem to be a night owl! Your peak productivity hits in the afternoon/evening.";
    }

    // Simple correlation score
    res.json({
      pattern,
      stats: {
        avgMood: (logs.reduce((sum, l) => sum + l.mood, 0) / logs.length).toFixed(1),
        avgEnergy: (logs.reduce((sum, l) => sum + l.energy, 0) / logs.length).toFixed(1),
        totalLogs: logs.length
      }
    });

  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET Advanced Consistency Streaks
router.get('/advanced-streaks', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    now.setHours(0,0,0,0);

    const tasks = await Task.find({ userId });
    const sessions = await FocusSession.find({ userId });

    let onTimeStreak = 0;
    let deepWorkStreak = 0;
    let noProcrastinationStreak = 0;

    for (let i = 0; i < 30; i++) {
      const dayStart = new Date(now.getTime() - i * 86400000);
      const dayEnd = new Date(dayStart.getTime() + 86400000 - 1);

      const completedToday = tasks.filter(t => t.status === 'completed' && t.completedDate >= dayStart && t.completedDate <= dayEnd);
      const anyLate = completedToday.some(t => t.deadline && new Date(t.completedDate) > new Date(t.deadline));
      
      if (completedToday.length > 0 && !anyLate) {
        onTimeStreak++;
      } else if (completedToday.length > 0 && anyLate) {
        if (i > 0) break;
      }

      const daySessions = sessions.filter(s => s.startTime >= dayStart && s.startTime <= dayEnd);
      const dayTotalSeconds = daySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      if (dayTotalSeconds >= 7200) {
        deepWorkStreak++;
      } else if (i > 0) {
          break;
      }

      const procrastinatedToday = tasks.some(t => 
        t.rescheduleHistory.some(h => h.timestamp >= dayStart && h.timestamp <= dayEnd)
      );
      if (!procrastinatedToday) {
        if (completedToday.length > 0 || daySessions.length > 0) {
          noProcrastinationStreak++;
        }
      } else if (i > 0) {
          break;
      }
    }

    res.json({
      onTimeStreak,
      deepWorkStreak,
      noProcrastinationStreak
    });

  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET Burnout & Overload Analysis
router.get('/burnout-check', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0,0,0,0);

    const pendingTasks = await Task.find({ userId, status: 'pending' });
    const totalAllocatedToday = pendingTasks.reduce((sum, t) => sum + (t.allocatedTime || 0), 0);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCompletions = await Task.find({
      userId,
      status: 'completed',
      completedDate: { $gte: sevenDaysAgo }
    });

    const recentLogs = await UserLog.find({
      userId,
      timestamp: { $gte: sevenDaysAgo }
    });

    const avgMood = recentLogs.length > 0 ? recentLogs.reduce((sum, l) => sum + l.mood, 0) / recentLogs.length : 3;
    const avgEnergy = recentLogs.length > 0 ? recentLogs.reduce((sum, l) => sum + l.energy, 0) / recentLogs.length : 3;

    let riskLevel = 'low';
    const warnings = [];
    const suggestions = [];

    if (totalAllocatedToday > 600) {
      riskLevel = 'high';
      warnings.push("Extreme Overload: You have over 10 hours of work scheduled for today.");
      suggestions.push("Reschedule at least 3 non-urgent tasks to next week.");
    } else if (totalAllocatedToday > 360) {
      riskLevel = 'medium';
      warnings.push("High Load: You're approaching your daily limit.");
      suggestions.push("Prioritize your top 3 tasks and leave the rest for tomorrow.");
    }

    if (avgMood < 2.5 && totalAllocatedToday > 240) {
      riskLevel = 'high';
      warnings.push("Burnout Risk: Your mood logs are low while your workload remains high.");
      suggestions.push("Take a mandatory 'Focus-Free' afternoon. Go for a walk.");
    }

    if (avgEnergy < 2 && recentCompletions.length < 3) {
      riskLevel = 'high';
      warnings.push("Recovery Needed: Your energy and completion rates are significantly down.");
      suggestions.push("Convert your next deep work block into a 20-min power nap.");
    }

    res.json({
      riskLevel,
      totalAllocatedToday,
      warnings,
      suggestions,
      stats: {
        avgMood: parseFloat(avgMood.toFixed(1)),
        avgEnergy: parseFloat(avgEnergy.toFixed(1))
      }
    });

  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET Goal Alignment Analysis
router.get('/goal-alignment', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const tasks = await Task.find({
            userId,
            status: 'completed',
            completedDate: { $gte: sevenDaysAgo }
        });

        if (tasks.length === 0) {
            return res.json({ alignmentPercentage: 0, insight: "No tasks completed this week to analyze alignment." });
        }

        const alignedTasks = tasks.filter(t => t.goalId);
        const alignmentPercentage = Math.round((alignedTasks.length / tasks.length) * 100);

        let insight = `You spent ${alignmentPercentage}% of your efforts on linked goals this week.`;
        if (alignmentPercentage < 30) {
            insight = `Only ${alignmentPercentage}% of your time was goal-aligned. Are you getting distracted by busywork?`;
        } else if (alignmentPercentage > 70) {
            insight = `Excellent alignment! ${alignmentPercentage}% of your work is directly moving the needle on your long-term goals.`;
        }

        // Goal breakdown
        const goalStats = {};
        alignedTasks.forEach(t => {
            goalStats[t.goalId] = (goalStats[t.goalId] || 0) + 1;
        });

        res.json({
            alignmentPercentage,
            insight,
            totalCompleted: tasks.length,
            alignedCount: alignedTasks.length
        });

    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// GET Monthly Work Report
router.get('/monthly', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const tasks = await Task.find({
            userId,
            status: { $in: ['completed', 'missed'] },
            $or: [
                { completedDate: { $gte: twelveMonthsAgo } },
                { createdDate: { $gte: twelveMonthsAgo } }
            ]
        });

        const sessions = await FocusSession.find({
            userId,
            createdAt: { $gte: twelveMonthsAgo }
        });

        const monthlyData = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

            const monthCompleted = tasks.filter(t => t.status === 'completed' && t.completedDate >= monthStart && t.completedDate <= monthEnd);
            const monthMissed = tasks.filter(t => t.status === 'missed' && t.createdDate >= monthStart && t.createdDate <= monthEnd);
            const monthSessions = sessions.filter(s => s.createdAt >= monthStart && s.createdAt <= monthEnd);

            const focusSeconds = monthSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

            monthlyData.push({
                month: monthNames[d.getMonth()],
                year: d.getFullYear(),
                completedTasks: monthCompleted.length,
                missedTasks: monthMissed.length,
                focusHours: Math.round(focusSeconds / 3600 * 10) / 10
            });
        }

        res.json(monthlyData);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
