import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Data } from '../types/typechain/Channel4';
import { getLikesFromUser } from './likes';
import { User, UserDocument } from '../models/users';
import { generateToken } from '../middleware/auth';
import { URLDocument } from '../models/urls';


export const createUser = async (req: Request, res: Response) => {
  const { address } = req.body;
  try {
    const user = await User.create({ walletAddress: address });
    const token = generateToken(user);
    res.status(201).json({
      user: user,
      token,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    } else {
      return res.status(400).json({error: 'Unknown error occurred while creating user'});
    }
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;

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

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json({ user: user });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    } else {
      return res.status(400).json({error: 'Unknown error occurred while getting user'});
    }
  }
};

export const attachURL = async (userId : Types.ObjectId, urlId: Types.ObjectId) => {
  const user = await User.findById(userId);
  if (user) {
    user.submittedUrls.push(urlId);
    user.syncedToBlockchain = false;
    await user.save();
  }
};

export const detachURL = async (userId: Types.ObjectId, urlId: Types.ObjectId) => {
  const user = await User.findById(userId);
  if (user) {
    const index = user.submittedUrls.indexOf(urlId);
    if (index > -1) {
      user.submittedUrls.splice(index, 1);
      user.syncedToBlockchain = false;
      await user.save();
    }
  }
};

export const getUsersToSync = async () : Promise<Data.UserToSyncStruct[]> => {
  const users: UserDocument[] = await User.find({ syncedToBlockchain: false }).populate({
    path: 'submittedUrls',
    model: 'Url',
  });
  const usersToSync = [];
  for (let i = 0, ni=users.length; i < ni; i++) {
    const user = users[i];
    const submittedContent = (user.submittedUrls as unknown as URLDocument[]).map((_url, index) => index);
    const urlNonces = await getLikesFromUser(user._id);
    usersToSync.push({
      userAddress: user.walletAddress,
      numberOfLikes: user.likedUrls.length,
      submittedContent: submittedContent,
      registeredAt: Math.floor(user.createdAt.getTime() / 1000),
      numberOfLikesInPeriod: 0,
      urlNonces: urlNonces
    });
  }
  return usersToSync;
}

export const markSynced = async (users: string[]) => {
  await User.updateMany(
    { walletAddress: { $in: users } },
    { syncedToBlockchain: true }
  );
}
// dow we need url param in getNonce?
export const getNonce = async (user: UserDocument, url: URLDocument) => {
  return await User.findOne({ walletAddress: user })
    .populate({
      path: 'likedUrls.url',
      model: 'Url',
  });
}
