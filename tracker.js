
/* Oops! Learning Streak & Progress Tracker */

(function () {
  "use strict";

  const STORAGE_KEY = "oopsStreakData";
  const QUIZ_STORAGE_KEY = "oopsQuizResults";

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

  function load() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      );

      return {
        studyDates: Array.isArray(data.studyDates)
          ? [...new Set(data.studyDates)].sort()
          : []
      };
    } catch {
      return { studyDates: [] };
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    window.dispatchEvent(new CustomEvent("oopsStreakUpdated", {
      detail: getData()
    }));
  }

  function recordStudyDay() {
    const data = load();
    const today = todayKey();

    if (!data.studyDates.includes(today)) {
      data.studyDates.push(today);
      data.studyDates.sort();
      save(data);
    }

    return getData();
  }

  function recordActivity() {
    return recordStudyDay();
  }

  function getData() {
    const data = load();
    const today = todayKey();
    const yesterday = shiftDate(today, -1);

    let streak = 0;
    let checkDate = data.studyDates.includes(today)
      ? today
      : yesterday;

    while (data.studyDates.includes(checkDate)) {
      streak++;
      checkDate = shiftDate(checkDate, -1);
    }

    let longestStreak = 0;
    let currentRun = 0;
    let previousDate = null;

    for (const date of data.studyDates) {
      if (previousDate && date === shiftDate(previousDate, 1)) {
        currentRun++;
      } else {
        currentRun = 1;
      }

      longestStreak = Math.max(longestStreak, currentRun);
      previousDate = date;
    }

    return {
      streak,
      longestStreak,
      studyDays: data.studyDates.length,
      studyDates: data.studyDates,
      studiedToday: data.studyDates.includes(today),
      today
    };
  }

  function loadQuizResults() {
    try {
      const results = JSON.parse(
        localStorage.getItem(QUIZ_STORAGE_KEY) || "[]"
      );

      return Array.isArray(results) ? results : [];
    } catch {
      return [];
    }
  }

  function recordQuizResult(score, total, activity) {
    const safeScore = Number(score);
    const safeTotal = Number(total);

    if (
      !Number.isFinite(safeScore) ||
      !Number.isFinite(safeTotal) ||
      safeTotal <= 0 ||
      safeScore < 0 ||
      safeScore > safeTotal
    ) {
      return null;
    }

    const results = loadQuizResults();

    const result = {
      activity: activity || "Vocabulary",
      score: safeScore,
      total: safeTotal,
      percentage: Math.round((safeScore / safeTotal) * 100),
      date: todayKey(),
      completedAt: new Date().toISOString()
    };

    results.push(result);
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(results));

    recordStudyDay();

    window.dispatchEvent(new CustomEvent("oopsQuizUpdated", {
      detail: getQuizStats()
    }));

    return result;
  }

  function getQuizStats() {
    const results = loadQuizResults();
    const totalTests = results.length;
    const totalCorrect = results.reduce(
      (sum, item) => sum + item.score, 0
    );
    const totalQuestions = results.reduce(
      (sum, item) => sum + item.total, 0
    );

    return {
      totalTests,
      totalCorrect,
      totalQuestions,
      averagePercentage: totalQuestions
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0,
      results
    };
  }

  function resetData() {
    const data = { studyDates: [] };
    save(data);
    return getData();
  }

  window.OopsTracker = {
    recordActivity,
    recordStudyDay,
    getData,
    resetData,
    todayKey,
    recordQuizResult,
    getQuizStats
  };
})();
