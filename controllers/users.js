const { generateToken } = require("../middleware/auth");
const { User } = require("../models/schema");

const createUser = async (req, res) => {
  const { address } = req.body;
  try {
    const user = await User.create({ walletAddress: address });
    const token = generateToken(user);
    res.status(200).json({
      user: user,
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;

    const [users, count] = await Promise.all([
      User.find()
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(),
    ]);

    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;

    res.status(200).json({
      users: users,
      hasNextPage,
    });
  } catch (error) {
    res.status(500).json({ error: "Error retrieving users" });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json({ user: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const attachURL = async (userId, urlId) => {
  const user = await User.findById(userId);
  if (user) {
    user.submittedUrls.push(urlId);
    await user.save();
  }
};

const detachURL = async (userId, urlId) => {
  const user = await User.findById(userId);
  if (user) {
    const index = user.submittedUrls.indexOf(urlId);
    if (index > -1) {
      user.submittedUrls.splice(index, 1);
      await user.save();
    }
  }
};

const markSynced = async (walletAddress) => {
  const user = await Url.findOne({ walletAddress });
  if (user) {
    user.syncedToBlockchain = true;
    await user.save();
  }
};

const clearPendingActions = async (userId, urlIds) => {
  const user = await User.findById(userId);
  if (user) {
    // remove all ids from pendingActions specified in urlIds
    user.pendingActions = user.pendingActions.filter(
      (action) => !urlIds.includes(action.url)
    );
    await user.save();
  }
}

module.exports = {
  createUser,
  getAllUsers,
  getUser,
  attachURL,
  detachURL,
  clearPendingActions,
  markSynced,
};
