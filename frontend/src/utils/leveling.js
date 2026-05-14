export const calculateLevel = (totalXp = 0) => {
    // Formula: Level = floor(sqrt(totalXp / 50)) + 1
    const level = Math.floor(Math.sqrt(totalXp / 50)) + 1;
    
    // XP required for current level
    const currentLevelXp = Math.pow(level - 1, 2) * 50;
    
    // XP required for next level
    const nextLevelXp = Math.pow(level, 2) * 50;
    
    // Progress towards next level
    const xpIntoLevel = totalXp - currentLevelXp;
    const xpNeededForLevel = nextLevelXp - currentLevelXp;
    const progressPercent = Math.min(100, Math.max(0, (xpIntoLevel / xpNeededForLevel) * 100));

    let title = "Novice 🌱";
    if (level >= 10 && level < 20) title = "Apprentice 🛠️";
    else if (level >= 20 && level < 30) title = "Adept ⚡";
    else if (level >= 30 && level < 40) title = "Expert 💎";
    else if (level >= 40 && level < 50) title = "Master 👑";
    else if (level >= 50) title = "Flow State Master 🌌";

    return {
        level,
        title,
        currentLevelXp,
        nextLevelXp,
        progressPercent
    };
};

export const UNLOCKABLE_THEMES = [
    { id: 'red-black', name: 'Crimson Flow', reqLevel: 1 },
    { id: 'purple-black', name: 'Deep Focus', reqLevel: 1 },
    { id: 'light', name: 'Daylight', reqLevel: 1 },
    { id: 'lite', name: 'Minimal', reqLevel: 1 },
    { id: 'gold-black', name: 'Golden Master', reqLevel: 10 },
    { id: 'cyberpunk', name: 'Cyberpunk', reqLevel: 20 },
    { id: 'neon-flow', name: 'Neon Flow', reqLevel: 30 }
];
