const Case = require("../database/models/Case");

async function getNextCaseId(guildId) {
  const lastCase = await Case
    .findOne({ guildId })
    .sort({ caseId: -1 });

  return lastCase ? lastCase.caseId + 1 : 1;
}

module.exports = { getNextCaseId };