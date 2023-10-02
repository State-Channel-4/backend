import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Tag, TagDocument } from '../models/schema';

const createTag = async (req: Request, res: Response) => {
  try {
    const name: string = req.body.params[0];
    const createdBy: string = req.body.userId;
    const tag: TagDocument = await Tag.create({ name, createdBy });
    res.status(201).json({ tag });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      return res.status(500).json({ error: error.message });
    } else {
      // Handle unknown error type
      return res.status(500).json({ error: 'Unknown Error occurred while creating tag' });
    }
  }
};

const getAllTags = async (req: Request, res: Response) => {
  try {
    const tags: TagDocument[] = await Tag.find();
    res.status(200).json({ tags });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      return res.status(500).json({ error: error.message });
    } else {
      // Handle unknown error type
      return res.status(500).json({ error: 'Unknown Error occurred while fetching tags' });
    }
  }
};

const attachURL = async (tags: Types.ObjectId[], urlId: Types.ObjectId) => {
  for (const tagId of tags) {
    const tag: TagDocument | null = await Tag.findById(tagId);
    if (tag) {
      tag.urls.push(urlId);
      await tag.save();
    }
  }
};

const detachURL = async (tags: Types.ObjectId[], urlId: Types.ObjectId) => {
  for (const tagId of tags) {
    const tag: TagDocument | null = await Tag.findById(tagId);
    if (tag) {
      const index = tag.urls.indexOf(urlId);
      if (index > -1) {
        tag.urls.splice(index, 1);
        await tag.save();
      }
    }
  }
};

const getTagsToSync = async () => {
  return Tag.find({ syncedToBlockchain: false })
    .populate({
      path: 'createdBy',
      model: 'User',
      select: 'walletAddress'
    })
    .then(tags => tags.map(tag => ({
      name: tag.name,
      createdBy: tag.createdBy.walletAddress
    })));
}

const markSynced = async (tags: string[]) => {
  await Tag.updateMany(
    { name: { $in: tags } },
    { syncedToBlockchain: true }
  );
}

export {
  createTag,
  getAllTags,
  attachURL,
  detachURL,
  getTagsToSync,
  markSynced,
};
