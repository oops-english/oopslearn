
(function () {
  "use strict";

  const STORAGE_KEY = "oopsAccessibleMode";

  function applyMode(enabled) {
    document.body.classList.toggle("accessible", enabled);

    const button = document.getElementById("modeBtn");

    if (button) {
      button.setAttribute("aria-pressed", String(enabled));
      button.textContent = enabled ? "Normal Mode" : "Accessible Mode";
    }
  }

  function loadMode() {
    return localStorage.getItem(STORAGE_KEY) === "true";
  }

  function toggleMode() {
    const enabled = !loadMode();

    localStorage.setItem(STORAGE_KEY, String(enabled));
    applyMode(enabled);
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyMode(loadMode());

    const button = document.getElementById("modeBtn");

    if (button) {
      button.addEventListener("click", toggleMode);
    }
  });

  window.OopsAccessibility = {
    applyMode,
    loadMode,
    toggleMode
  };
})();
