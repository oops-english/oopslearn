(function () {
  "use strict";

  const STORAGE_KEY = "oopsProfileSettings";

  function loadSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function applySettings() {
    const settings = loadSettings();

    // Apply the primary color across the website
    if (settings.primaryColor) {
  document.documentElement.style.setProperty(
    "--primary",
    settings.primaryColor
  );

  document.documentElement.style.setProperty(
    "--bg",
    settings.primaryColor + "12"
  );
}

    // Apply the background image across the website
    if (settings.backgroundImage) {
      document.body.style.backgroundImage =
        `url("${settings.backgroundImage}")`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundRepeat = "no-repeat";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applySettings);
  } else {
    applySettings();
  }

  window.OopsSettings = {
    loadSettings,
    applySettings
  };
})();
