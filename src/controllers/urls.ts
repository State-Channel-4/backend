import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Url } from '../models/schema';
import { shuffle } from '../lib/utils';
import * as TagControl from './tags';
import * as UserControl from './users';
import {  UserDocument, TagDocument } from '../models/schema';
import { UrlToSync } from '../types/contract';
import { groupUpdate } from '../lib/grouping';


const createURL = async (req: Request, res: Response) => {
  try {
      const [title, url, tags] = req.body.params;
    const submittedBy = req.body.userId;
    if (!tags || tags.length === 0) {
      return res.status(400).json({ error: "Please add some tags to the URL" });
    }

    const existingUrl = await Url.findOne({ url });
    if (existingUrl) {
      return res.status(400).json({ error: "URL already exists" });
    }

    const newUrl = await Url.create({ title, url, submittedBy, tags });

    await TagControl.attachURL(tags, newUrl.id);
    await UserControl.attachURL(submittedBy, newUrl.id);
    // add or update the user in group for matchmaking
    groupUpdate(submittedBy);

    return res.status(201).json(newUrl);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const  updateUrlVerificationStatus = async (req: Request, res: Response) => {
  try {
    console.log("body params : ", req.body);
    const { urlId, status } = req.body;
    // get array of urlID and update all with verified to true
    const urls = await Url.updateMany({ _id: { $in: urlId } }, { verified: status });
    console.log("urls : ", urls);    
    if(!urls) {
      return res.status(400).json({ error: "URL not found" });
    }
    return res.status(200).json({ message: "URL verification status updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }

}

const deleteURL = async (req: Request, res: Response) => {
  try {
    const { urlId } = req.params;
    const urlObjectId = new mongoose.Types.ObjectId(urlId);

    const url = await Url.findById(urlId);
    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }

    await TagControl.detachURL(url.tags, urlObjectId);
    await UserControl.detachURL(url.submittedBy, urlObjectId);

    await Url.deleteOne({ _id: urlId });

    return res.status(200).json({ message: "URL removed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

const __getURLsFromDb = async (tags: string[] | "all" = ["all"], limit: number = 100) => {
  tags = Array.isArray(tags) ? tags : [tags];

  try {
    let query;
    if (tags.includes("all")) {
      query = Url.aggregate([{ $sample: { size: parseInt(limit.toString()) } }]);
    } else {
      const userTagObjectIds = tags.map(
        (tag) => new mongoose.Types.ObjectId(tag)
      );
      query = Url.aggregate([
        { $match: { tags: { $in: userTagObjectIds } } },
        { $sample: { size: parseInt(limit.toString()) } },
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

const getMixedURLs = async (req: Request, res: Response) => {
  try {
    const tags = req.query.tags as string[];
    const limit = parseInt(req.query.limit as string);
    const urls = await __getURLsFromDb(tags, limit);

    res.status(200).json({
      urls: shuffle(urls),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while fetching mixed URLs" });
  }
};

const getContentToSync = async (): Promise<UrlToSync[]> => {
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
      const userDoc = (url.submittedBy as unknown) as UserDocument
      return {
        title: url.title,
        url: url.url,
        submittedBy: userDoc.walletAddress,
        tagIds: url.tags.map(tag => {
          const tagDoc = (tag as unknown) as TagDocument
          return tagDoc.name
        })
      }
    }));
};

const markSynced = async (urls: UrlToSync[]) => {
  await Url.updateMany(
    { title: { $in: urls } },
    { syncedToBlockchain: true }
  );
};

export {
  createURL,
  deleteURL,
  getMixedURLs,
  getContentToSync,
  markSynced,
};
