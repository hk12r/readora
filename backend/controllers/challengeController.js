const Challenge = require("../models/Challenge");
const User = require("../models/User");

// Seed default challenges if none exist
const defaultChallenges = [
  {
    title: "2026 Reading Voyage",
    description: "Read 25 books throughout the year and expand your literary universe.",
    type: "count",
    category: "Annual",
    targetCount: 25,
    badgeReward: {
      name: "Voyager of 2026",
      icon: "🧭",
      xp: 250,
    },
    isPublic: true,
  },
  {
    title: "Around the World in 10 Books",
    description: "Explore 10 stories written by authors from 10 different countries.",
    type: "country",
    category: "World Literature",
    targetCount: 10,
    badgeReward: {
      name: "Literary Globetrotter",
      icon: "🗺️",
      xp: 200,
    },
    isPublic: true,
  },
  {
    title: "The 10,000 Page Summit",
    description: "Climb the page mountain by reading a cumulative 10,000 pages.",
    type: "pages",
    category: "Endurance",
    targetCount: 10000,
    badgeReward: {
      name: "Apex Reader",
      icon: "🏔️",
      xp: 300,
    },
    isPublic: true,
  },
  {
    title: "Special Prompts Quest",
    description: "Complete 5 unique reading prompts to unlock the Lorekeeper badge.",
    type: "prompts",
    category: "Prompts",
    targetCount: 5,
    prompts: [
      { id: "p1", text: "A book with a map in the front", completed: false },
      { id: "p2", text: "A book set on an island or in outer space", completed: false },
      { id: "p3", text: "A book originally published in a different language", completed: false },
      { id: "p4", text: "A book featuring a cozy café, bakery, or library", completed: false },
      { id: "p5", text: "A book published over 50 years ago", completed: false },
    ],
    badgeReward: {
      name: "Prompt Lorekeeper",
      icon: "📜",
      xp: 220,
    },
    isPublic: true,
  },
];

const seedChallengesIfNeeded = async () => {
  try {
    const count = await Challenge.countDocuments();
    if (count === 0) {
      await Challenge.insertMany(defaultChallenges);
      console.log("Seeded default public reading challenges.");
    }
  } catch (err) {
    console.warn("Could not seed challenges:", err.message);
  }
};

// GET all challenges (public + user-created)
const getChallenges = async (req, res) => {
  try {
    await seedChallengesIfNeeded();
    const userId = req.user?._id;

    const challenges = await Challenge.find({
      $or: [{ isPublic: true }, { creatorId: userId }],
    }).sort({ createdAt: -1 });

    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST create custom challenge
const createChallenge = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      description,
      type = "count",
      targetCount = 12,
      category = "Custom",
      prompts = [],
      deadline,
    } = req.body;

    const challenge = new Challenge({
      title,
      description,
      type,
      targetCount,
      category,
      prompts,
      deadline,
      creatorId: userId,
      isPublic: true,
      participants: [{ userId, progress: 0, completed: false }],
    });

    await challenge.save();
    res.status(201).json(challenge);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST join challenge
const joinChallenge = async (req, res) => {
  try {
    const userId = req.user._id;
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: "Challenge not found" });

    const alreadyJoined = challenge.participants.some(
      (p) => p.userId?.toString() === userId.toString()
    );

    if (!alreadyJoined) {
      challenge.participants.push({
        userId,
        progress: 0,
        completed: false,
      });
      await challenge.save();
    }

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT update challenge progress
const updateChallengeProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { progress, promptId, completedBookTitle } = req.body;

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: "Challenge not found" });

    let participant = challenge.participants.find(
      (p) => p.userId?.toString() === userId.toString()
    );

    if (!participant) {
      participant = { userId, progress: 0, completed: false };
      challenge.participants.push(participant);
    }

    if (promptId && challenge.prompts) {
      const pr = challenge.prompts.find((p) => p.id === promptId);
      if (pr) {
        pr.completed = true;
        if (completedBookTitle) pr.bookTitle = completedBookTitle;
      }
      const completedPrompts = challenge.prompts.filter((p) => p.completed).length;
      participant.progress = completedPrompts;
    } else if (progress !== undefined) {
      participant.progress = progress;
    }

    if (participant.progress >= challenge.targetCount && !participant.completed) {
      participant.completed = true;
      // Award badge & XP
      const user = await User.findById(userId);
      if (user) {
        user.xp = (user.xp || 0) + (challenge.badgeReward?.xp || 200);
        user.level = Math.floor(user.xp / 200) + 1;
        if (challenge.badgeReward) {
          user.badges.push({
            id: `chal_${challenge._id}`,
            name: challenge.badgeReward.name,
            icon: challenge.badgeReward.icon,
            description: `Completed the "${challenge.title}" challenge!`,
            earnedAt: new Date(),
          });
        }
        await user.save();
      }
    }

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getChallenges,
  createChallenge,
  joinChallenge,
  updateChallengeProgress,
  seedChallengesIfNeeded,
};
