module.exports = {
  intern: {
    name: "Intern",
    cost: 0,
    difficulty: "easy",
    minPay: 150,
    maxPay: 250,
    requirements: {
      level: 0,
      reputation: 0,
      items: [],
      shifts: 5,
    },
  },

  delivery: {
    name: "Delivery Boy",
    cost: 2000,
    difficulty: "medium",
    minPay: 300,
    maxPay: 500,
    requirements: {
      level: 3,
      reputation: 10,
      items: ["bike"],
      shifts: 6,
    },
  },

  coder: {
    name: "Coder",
    cost: 10000,
    difficulty: "hard",
    minPay: 700,
    maxPay: 1200,
    requirements: {
      level: 7,
      reputation: 30,
      items: ["laptop"],
      shifts: 4,
    },
  },

  manager: {
    name: "Manager",
    cost: 50000,
    difficulty: "veryhard",
    minPay: 1500,
    maxPay: 2500,
    requirements: {
      level: 15,
      reputation: 80,
      items: ["suit"],
      shifts: 3,
    },
  },
};
