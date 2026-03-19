const snipes = new Map();

module.exports = {
  add(channelId, data) {
    if (!snipes.has(channelId)) snipes.set(channelId, []);
    snipes.get(channelId).unshift(data);
    if (snipes.get(channelId).length > 20) snipes.get(channelId).pop();
  },

  get(channelId, index = 0) {
    return snipes.get(channelId)?.[index];
  }
};
