function pickWeighted(users) {
  if (!users || users.length === 0) return null;
  let totalWeight = users.reduce((acc, user) => acc + (user.weight || 1), 0);
  let random = Math.floor(Math.random() * totalWeight);
  
  for (const user of users) {
    random -= (user.weight || 1);
    if (random < 0) return user.id;
  }
  return users[0].id;
}

module.exports = { pickWeighted };
