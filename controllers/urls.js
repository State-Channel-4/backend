const { default: mongoose } = require("mongoose");
const { Url, User } = require("../models/schema");
const shuffle = require("../lib/utils").shuffle;
const TagControl = require("./tags");
const UserControl = require("./users");

const createURL = async (req, res) => {
  try {
    const [title, url, tags] = req.body.params;
    const submittedBy = req.body.userId;
    const existingUrl = await Url.findOne({ url });
    if (existingUrl) {
      return res.status(400).json({ error: "URL already exists" });
    }

    const newUrl = await Url.create({ title, url, submittedBy, tags });

    TagControl.attachURL(tags, newUrl.id);
    UserControl.attachURL(submittedBy, newUrl.id);

    return res.status(201).json(newUrl);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

const deleteURL = async (req, res) => {
  try {
    const { urlId } = req.params;
    const url = await Url.findById(urlId);
    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }

    await TagControl.detachURL(url.tags, urlId);
    await UserControl.detachURL(url.submittedBy, urlId);

    await Url.deleteOne({ _id: urlId });

    return res.status(200).json({ message: "URL removed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

const __getURLsFromDb = async (tags = ["all"], limit = 100) => {
  tags = Array.isArray(tags) ? tags : [tags];

  try {
    let query;
    if (tags.includes("all")) {
      query = Url.aggregate([{ $sample: { size: parseInt(limit) } }]);
    } else {
      const userTagObjectIds = tags.map(
        (tag) => new mongoose.Types.ObjectId(tag)
      );
      query = Url.aggregate([
        { $match: { tags: { $in: userTagObjectIds } } },
        { $sample: { size: parseInt(limit) } },
      ]);
    }

    const results = await query.exec();

    // Populate 'tags' and 'name' fields
    const populatedResults = await Url.populate(results, [
      { path: "tags", select: "name" },
    ]);

    return populatedResults;
  } catch (error) {
    throw error;
  }
};

const getMixedURLs = async (req, res) => {
  try {
    const { tags, limit } = req.query;
    const urls = await __getURLsFromDb(tags, limit);

    res.status(200).json({
      urls: shuffle(urls),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while fetching mixed URLs" });
  }
};

const handleLike = async (req, res) => {
  try {
    const {
      params: { id: urlId },
      body: { address },
    } = req;
    const existingUser = await User.findOne({ walletAddress: address });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const urlAlreadyLiked = existingUser.likedUrls.includes(urlId);

    // Toggle like status and update likes count
    const likesChange = urlAlreadyLiked ? -1 : 1;
    const updatedUrl = await Url.findByIdAndUpdate(
      urlId,
      { $inc: { likes: likesChange } },
      { new: true }
    );

    // Update user's liked URLs
    existingUser.likedUrls = urlAlreadyLiked
      ? existingUser.likedUrls.filter((url) => url !== urlId)
      : [...existingUser.likedUrls, updatedUrl];

    await existingUser.save();
    return res.json(existingUser);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "We couldn't update the likes" });
  }
};

module.exports = {
  createURL,
  deleteURL,
  getMixedURLs,
  handleLike,
};
