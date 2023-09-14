const { Tag } = require("../models/schema");

const createTag = async (req, res) => {
  try {
    const name = req.body.params[0];
    const createdBy = req.body.userId;
    const tag = await Tag.create({ name: name, createdBy: createdBy });
    res.status(200).json({ tag: tag });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

const getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find();
    res.status(200).json({ tags: tags });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

const attachURL = async (tags, urlId) => {
  for (const tagId of tags) {
    const tag = await Tag.findById(tagId);
    if (tag) {
      tag.urls.push(urlId);
      await tag.save();
    }
  }
};

const detachURL = async (tags, urlId) => {
  for (const tagId of tags) {
    const tag = await Tag.findById(tagId);
    if (tag) {
      const index = tag.urls.indexOf(urlId);
      if (index > -1) {
        tag.urls.splice(index, 1);
        await tag.save();
      }
    }
  }
};

const markSynced = async (name) => {
  const tag = await Tag.findOne({ name });
  if (tag) {
    tag.syncedToBlockchain = true;
    await tag.save();
  }
};

module.exports = {
  createTag,
  getAllTags,
  attachURL,
  detachURL,
  markSynced,
};
