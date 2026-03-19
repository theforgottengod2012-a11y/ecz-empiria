const User = require("../../database/models/User");

const jobs = {
  cleaner: { level: 1 },
  clerk: { level: 3 },
  hacker: { level: 7, item: "laptop" },
};

module.exports = {
  name: "job",
  aliases: ["applyjob"],
  description: "Apply for a job",
  async execute(message, args, client) {
    const jobName = args[0];
    if (!jobName) {
      return message.reply("💼 Available jobs: `cleaner`, `clerk`, `hacker`");
    }

    const job = jobs[jobName];
    if (!job) return message.reply("❌ Job does not exist.");

    const user = await User.findOne({ userId: message.author.id });
    if (!user) return message.reply("❌ You don’t have an account yet.");

    if (user.level < job.level)
      return message.reply(`❌ You need level ${job.level} for this job.`);

    if (job.item && !user.inventory.includes(job.item))
      return message.reply(`❌ You need **${job.item}** to apply.`);

    user.job = jobName;
    await user.save();

    message.reply(`✅ You are now working as a **${jobName}**`);
  },
};
