
/* Oops! Learning Streak Tracker */

(function () {
  "use strict";

  const STORAGE_KEY = "oopsStreakData";

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
    todayKey
  };
})();
