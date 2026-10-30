
/* Oops! Shared Learning Tracker v2 */

(function () {
  "use strict";

  const STORAGE_KEY = "oopsTrackerData";
  const VERSION = 2;

  const XP_REWARDS = {
    vocabulary: 5,
    grammar: 10,
    errorFix: 10,
    ielts: 15,
    placement: 20,
    dailyCheckIn: 5
  };

  function todayKey() {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
  }

  function shiftDate(date, amount) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + amount);
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
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
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!data || data.version !== VERSION) return emptyData();

      return {
        ...emptyData(),
        ...data,
        activities: Array.isArray(data.activities) ? data.activities : [],
        completedQuests: Array.isArray(data.completedQuests)
          ? data.completedQuests : [],
        unlockedAchievements: Array.isArray(data.unlockedAchievements)
          ? data.unlockedAchievements : []
      };
    } catch {
      return emptyData();
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    window.dispatchEvent(new CustomEvent("oopsTrackerUpdated", {
      detail: getData()
    }));
  }

  function updateStreak(data) {
    const today = todayKey();

    if (data.lastActiveDate === today) return;

    if (data.lastActiveDate === shiftDate(today, -1)) {
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
      id: Date.now() + "-" + Math.random().toString(36).slice(2),
      activityId,
      type,
      xp: reward,
      date: todayKey(),
      timestamp: new Date().toISOString(),
      details: {
        label: String(details.label || type).slice(0, 120)
      }
    });

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
    const range = nextLevelXP - previousLevelXP;

    return {
      ...data,
      level,
      nextLevelXP,
      xpToNextLevel: Math.max(0, nextLevelXP - data.xp),
      levelProgress: Math.min(100, Math.max(0,
        Math.round((data.xp - previousLevelXP) / range * 100)
      )),
      today: todayKey(),
      todayActivities: data.activities.filter(
        item => item.date === todayKey()
      )
    };
  }

  function completeQuest(questId, xpReward, diamondReward = 0) {
    const data = load();
    const id = todayKey() + ":" + questId;

    if (data.completedQuests.includes(id)) {
      return { success: false, message: "Quest already completed." };
    }

    data.completedQuests.push(id);
    data.xp += Math.max(0, Number(xpReward) || 0);
    data.diamonds += Math.max(0, Number(diamondReward) || 0);

    updateStreak(data);
    save(data);

    return {
      success: true,
      totalXP: data.xp,
      diamonds: data.diamonds
    };
  }

  function isQuestCompleted(questId) {
    return load().completedQuests.includes(
      todayKey() + ":" + questId
    );
  }

  function resetData() {
    const data = emptyData();
    save(data);
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
