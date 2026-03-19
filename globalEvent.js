const events = require("../data/globalEvents");

module.exports = {
  isActive(eventName) {
    if (!events.activeEvent) return false;
    if (Date.now() > events.expiresAt) {
      events.activeEvent = null;
      events.expiresAt = null;
      return false;
    }
    return events.activeEvent === eventName;
  },

  start(eventName, durationMinutes) {
    events.activeEvent = eventName;
    events.expiresAt = Date.now() + durationMinutes * 60 * 1000;
  },

  stop() {
    events.activeEvent = null;
    events.expiresAt = null;
  }
};