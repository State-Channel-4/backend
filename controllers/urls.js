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

const __getURLsFromDb = async (tags, page = 1, limit = 100) => {
  console.log("get url from db params : tags, page, limit", tags, page, limit);
  if (!tags) tags = "all";
  try {
    const skipCount = Math.max((page - 1) * limit, 0); // Ensure skipCount is non-negative

    const query = tags.includes("all")
      ? Url.find()
      : Url.find({ tags: { $in: tags } });

    const results = await query
      .skip(skipCount)
      .limit(limit)
      .populate("tags", "name");

    return results;
  } catch (error) {
    return { error };
  }
};

const getMixedURLs = async (req, res) => {
  try {
    const { tags, page, limit, isPageArray } = req.query;
    let genPageArray = (isPageArray === 'true');
    console.log(typeof(genPageArray));
    const count = tags.includes("all") ? await Url.countDocuments() : await Url.countDocuments({ tags: { $in: tags } });
    console.log("doc count : ", count);
    const totalPages = Math.ceil(count / limit);
    let pageArray = Array();
    let currentPageIndex = page

    if(genPageArray)
    {
      console.log("gen array");
      // Generate an array of page indices(1 based)
      pageArray = Array.from({ length: totalPages }, (_, index) => index + 1);
      console.log("page arr : ", pageArray);
      console.log("page arr length : ", pageArray.length);
      // Select a random page index
      currentPageIndex = Math.floor(Math.random() * pageArray.length);

    }     

    const urls = await __getURLsFromDb(tags, currentPageIndex, limit);

    res.status(200).json({
      urls: shuffle(urls),
      currentIndex: currentPageIndex,
      pageArray: pageArray,
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
