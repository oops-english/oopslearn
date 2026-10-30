
/* Oops! Shared Learning Tracker */

(function () {
  "use strict";

  const STORAGE_KEY = "oopsTrackerData";
  const VERSION = 1;

  const XP_REWARDS = {
    vocabulary: 5,
    grammar: 10,
    errorFix: 10,
    ielts: 15,
    placement: 20,
    dailyCheckIn: 5
  };

  function todayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function yesterdayKey() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function emptyData() {
    return {
      version: VERSION,
      xp: 0,
      diamonds: 0,
      streak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      activities: [],
      completedQuests: [],
      unlockedAchievements: []
    };
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || saved.version !== VERSION) return emptyData();

      return {
        ...emptyData(),
        ...saved,
        activities: Array.isArray(saved.activities) ? saved.activities : [],
        completedQuests: Array.isArray(saved.completedQuests)
          ? saved.completedQuests : [],
        unlockedAchievements: Array.isArray(saved.unlockedAchievements)
          ? saved.unlockedAchievements : []
      };
    } catch {
      return emptyData();
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function updateStreak(data) {
    const today = todayKey();

    if (data.lastActiveDate === today) return;

    if (data.lastActiveDate === yesterdayKey()) {
      data.streak += 1;
    } else {
      data.streak = 1;
    }

    data.longestStreak = Math.max(data.longestStreak, data.streak);
    data.lastActiveDate = today;
  }

  function levelFromXP(xp) {
    return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
  }

  function xpForNextLevel(level) {
    return level * level * 100;
  }

  function recordActivity(type, details = {}) {
    if (!Object.prototype.hasOwnProperty.call(XP_REWARDS, type)) {
      return { success: false, message: "Unknown activity type." };
    }

    const data = load();
    const today = todayKey();

    // Prevent accidental duplicate submissions of the same activity.
    const activityId = details.activityId
      ? String(details.activityId)
      : null;

    if (activityId && data.activities.some(
      item => item.activityId === activityId
    )) {
      return { success: false, message: "Activity already recorded." };
    }

    updateStreak(data);

    const reward = XP_REWARDS[type];

    data.xp += reward;
    data.activities.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      activityId,
      type,
      xp: reward,
      date: today,
      timestamp: new Date().toISOString(),
      details: {
        label: String(details.label || type).slice(0, 120)
      }
    });

    // Keep a manageable local activity history.
    data.activities = data.activities.slice(-1000);

    save(data);

    return {
      success: true,
      xpEarned: reward,
      totalXP: data.xp,
      streak: data.streak,
      level: levelFromXP(data.xp)
    };
  }

  function getData() {
    const data = load();
    const level = levelFromXP(data.xp);
    const nextLevelXP = xpForNextLevel(level);
    const previousLevelXP = xpForNextLevel(level - 1);
    const progressRange = nextLevelXP - previousLevelXP;

    return {
      ...data,
      level,
      nextLevelXP,
      xpToNextLevel: Math.max(0, nextLevelXP - data.xp),
      levelProgress: Math.min(
        100,
        Math.max(0, Math.round(
          ((data.xp - previousLevelXP) / progressRange) * 100
        ))
      ),
      today: todayKey(),
      todayActivities: data.activities.filter(
        item => item.date === todayKey()
      )
    };
  }

  function completeQuest(questId, xpReward, diamondReward = 0) {
    const data = load();
    const today = todayKey();
    const id = `${today}:${questId}`;

    if (data.completedQuests.includes(id)) {
      return { success: false, message: "Quest already completed." };
    }

    data.completedQuests.push(id);
    data.xp += Math.max(0, Number(xpReward) || 0);
    data.diamonds += Math.max(0, Number(diamondReward) || 0);

    save(data);

    return {
      success: true,
      totalXP: data.xp,
      diamonds: data.diamonds
    };
  }

  function isQuestCompleted(questId) {
    const data = load();
    return data.completedQuests.includes(
      `${todayKey()}:${questId}`
    );
  }

  function resetData() {
    localStorage.removeItem(STORAGE_KEY);
    return getData();
  }

  window.OopsTracker = {
    recordActivity,
    getData,
    completeQuest,
    isQuestCompleted,
    resetData,
    todayKey,
    XP_REWARDS
  };
})();
