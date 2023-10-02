const { default: mongoose } = require("mongoose");
const { Url, User } = require("../models/schema");
const shuffle = require("../lib/utils").shuffle;
const TagControl = require("./tags");
const UserControl = require("./users");
const LikeControl = require("./likes");

const createURL = async (req, res) => {
  try {
    const [title, url, _submittedBy, _likes, tags] = req.body.params;
    const submittedBy = req.body.userId;

    if (!tags || tags.length === 0) {
      return res.status(400).json({ error: "Please add some tags to the url" });
    }

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

const getContentToSync = async () => {
  return await Url.find({ syncedToBlockchain: false })
    .populate({
      path: 'submittedBy',
      model: 'User',
      select: 'walletAddress'
    })
    .populate({
      path: 'tags',
      model: 'Tag',
      select: 'name'
    })
    .then(urls => urls.map(url => {
      return {
        title: url.title,
        url: url.url,
        submittedBy: url.submittedBy.walletAddress,
        tagIds: url.tags.map(tag => tag.name)
      }
    }));
}

const markSynced = async (urls) => {
  await Url.updateMany(
    { title: { $in: urls } },
    { syncedToBlockchain: true }
  );
}

module.exports = {
  createURL,
  deleteURL,
  getMixedURLs,
  getContentToSync,
  markSynced,
};
