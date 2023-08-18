import { ethers } from 'ethers';
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import mongoose from 'mongoose';
import  MyContract  from './contract';


// Models
import User from "../models/users"
import { IUserSchema } from "../models/users";

import Url, { SyncUrl }  from '../models/urls';
import { IUrl } from '../models/urls';

import Tag, { Synctag }  from '../models/tags';
import { ITag } from '../models/tags';
// auth middleware
import { generateToken } from '../middleware/auth';


const create_contract = (): ethers.Contract => {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS ?? "", process.env.ABI ?? [], provider);
    return contract;
};


// create user
const create_user = async(req: Request, res: Response): Promise<Response> => {
  const {address} = req.body
  try {
    const user = await User.create({walletAddress: address})
    const token = generateToken(user);
    return res.status(200).json({
      user: user,
      token,
    })
  } catch (error: any) { // Explicitly type 'error' as 'any'
    return res.status(400).json({ error: error.message })
  }
}

// get all users
const get_all_users = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page: number = parseInt(req.query.page as string) || 1; // Get the page number from query parameters, default to 1 if not provided
    const limit: number = parseInt(req.query.limit as string) || 100; // Get the limit from query parameters, default to 100 if not provided

    const [users, count] = await Promise.all([
      User.find()
        .skip((page - 1) * limit) // Skip the appropriate number of documents based on the page and limit
        .limit(limit), // Limit the number of documents returned per page
      User.countDocuments()
    ]);

    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;

    return res.status(200).json({
      users: users,
      hasNextPage
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error retrieving users' });
  }
};


// login
const login = async(req: Request, res: Response): Promise<Response> => {
  try{
    const {signedMessage} = req.body

    const message: string = process.env.LOGIN_SECRET ?? "";
    const signer = ethers.verifyMessage(message, signedMessage);
    const user = await User.findOne({walletAddress: signer })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    console.log("user : ", user)
    const token = generateToken(user)
    console.log("token : ", token)
    return res.status(200).json({user: user, token: token})
  } catch(error: any) {
    return res.status(500).json({error : error.message})
  }
}

// get user by id
/**
 *
 * @param {object} req request object
 * @param {object} res response object
 * how to call
 * {
 * localhost:4000/api/user/:id
 * localhost:4000/api/user:/123
 * }
 */
const get_specific_user = async(req: Request, res: Response): Promise<Response> => {
  console.log("get user by id : ", req.params.id)
  try {
    const id = req.params.id as unknown as mongoose.Types.ObjectId
    const user = await User.findById(id)
    return res.status(200).json({user: user})
  } catch(error: any) {
    return res.status(400).json({error: error.message})
  }
}


// recover using mnemonic phrase
const recover_account = async(req: Request, res: Response): Promise<Response> => {
    const { mnemonic } = req.body
    try {
        console.log("mnemonic : ", mnemonic)
        const mnemonicWallet = ethers.Wallet.fromPhrase(mnemonic);
        console.log("private key : ", mnemonicWallet.privateKey)
        return res.status(200).json({address: mnemonicWallet.address,
                              public_key: mnemonicWallet.publicKey,
                              private_key: mnemonicWallet.privateKey},
                              )
    } catch(error: any) {
        return res.status(400).json({error: error.message})
    }

}

// PUT toogle likes like or unlike
const toggleLike = async (req: Request, res: Response): Promise<Response> => {
  try {
    const url_id: string = req.params.id
    const { address } = req.body
    const existingUser = await User.findOne({walletAddress: address })
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' })
    }
    // Convert url_id to ObjectId
    const urlObjectId = url_id as unknown as mongoose.Types.ObjectId;

    // Check if the like value already exists in the array
    if (!existingUser.likedUrls.includes(urlObjectId)) {
      // Append to the likes array if the value is not already present
      const url = await Url.findByIdAndUpdate(urlObjectId, {$inc: {likes: 1}},  { new: true })
      if(url) {
        existingUser.likedUrls.push(urlObjectId)
      }
    } else {
      // Unlike the URL if it was previously liked
      const index = existingUser.likedUrls.indexOf(urlObjectId)
      if (index > -1) {
        // Remove from the likes array
        existingUser.likedUrls.splice(index, 1)
        // Decrement like count
        await Url.findByIdAndUpdate(urlObjectId, {$inc: {likes: -1}},  { new: true })
      }
    }
    await existingUser.save()
    return res.json(existingUser)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}


// vote
/**
 *
 * @param {object} req
 * @param {object} res
 * @returns json
 * how to call
 * PUT localhost:4000/api/vote/id
 * expected json body in request
 {
 "address": "0x72....."
 }
 */
// like or unlike url
const like = async (req: Request, res: Response) => {
  const {id} = req.params
  console.log("id : ", id)
  console.log("body : ", req.body)
  return toggleLike(req, res)
}

/**
 *
 * @param {object} req
 * @param {object} res
 * @returns json
 * how to call
 * POST localhost:4000/api/url
 * expected json body in request
 {
  "title": "",
  "url": "",
  "submittedBy" : "user_id not walletaddress",
  "tags": []
 }
 */
 const submit_url = async(req: Request, res: Response) => {
  try {
    const title = req.body.params[0];
    const url = req.body.params[1];
    const tags = req.body.params[2];
    const submittedBy = req.body.userId;

    const existingUrl = await Url.findOne({ url }); // Check if the URL already exists in the database
    if (existingUrl) {
      return res.status(400).json({ error: 'URL already exists' });
    }
    const newUrl = await Url.create({ title: title, url: url, submittedBy: submittedBy, tags: tags }); // Create a new URL document in the database

    // add the url to the corresponding tags
    for (const tagId of tags) {
      const tag_doc = await Tag.findById(tagId);
      if (tag_doc) {
        tag_doc.urls.push(newUrl._id);
        await tag_doc.save();
      }
    }

    // Add the URL to the user's submittedBy array
    const user = await User.findById(submittedBy);
    if (user) {
      user.submittedUrls.push(newUrl._id);
      await user.save();
    }
    return res.status(201).json(newUrl);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// delete url
const delete_url = async(req: Request, res: Response) => {
  try {
    const {id} = req.body
    const del_url = await Url.deleteOne({"_id": id})
    return res.status(200).json(del_url)
  } catch(error: any) {
    return res.status(500).json({error : error.message})
  }
}

// creating tags
const create_tag = async(req: Request, res: Response) => {
  try {
    // name createdby
    const name = req.body.params[0];
    const createdBy = req.body.userId;
    const tag = await Tag.create({name: name, createdBy: createdBy})
    res.status(200).json({tag: tag})
  } catch (error: any) {
    console.log(error)
    return res.status(500).json({error : error.message})
  }
}

// get all tags
const get_all_tags = async(req: Request, res: Response) => {
  try {
    const tags = await Tag.find()
    res.status(200).json({tags: tags})
  } catch (error: any) {
    console.log(error)
    return res.status(500).json({error: error.message})
  }
}

// Helper function to url URLs based on tags
const fetchUrlsByTags = async (tags: ITag, page: number = 1, limit: number = 100): Promise<IUrl[]> => {
  try {
    const skipCount = (page - 1) * limit;
    return await Url.find({ tags: { $in: tags } })
      .skip(skipCount)
      .limit(limit)
      .populate('tags', 'name');
  } catch (error: unknown) {
    console.log("error occurred", error)
    return [];
  }
};

// return urls by tags. No shuffling
const getUrlsByTags = async (req: Request, res: Response) => {
  try {
    const tags: string = req.query.tags as string || ''; // Get the tags from query parameters
    const page: number = parseInt(req.query.page as string) || 1; // Get the page number from query parameters, default to 1 if not provided
    const limit: number = parseInt(req.query.limit as string) || 100; // Get the limit from query parameters, default to 100 if not provided

    const [urls, count] = await Promise.all([
      Url.find({ tags: { $in: tags } })
        .skip((page - 1) * limit) // Skip the appropriate number of documents based on the page and limit
        .limit(limit), // Limit the number of documents returned per page
      Url.countDocuments({ tags: { $in: tags } })
    ]);

    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;

    res.status(200).json({
      urls: urls,
      hasNextPage
    });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving URLs by tags' });
  }
};


// Helper function to shuffle an array
// Fisher-Yates algorithm O(n)
const shuffleArray = (array: IUrl[]) => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};


// mix feed
const mix = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { tags, page = '1', limit = '100' } = req.query;
    const tagsobj: ITag = JSON.parse(tags as string);
    const pageNum: number = parseInt(page as string) || 1;
    const limitNum: number = parseInt(limit as string) || 100;
    console.log("tags : page : limit ", tags, page, limit)
    // Fetch the URLs based on the provided tags
    const [urls, count] = await Promise.all([
      fetchUrlsByTags(tagsobj, pageNum, limitNum),
      Url.countDocuments({ tags: { $in: tags } })
    ]);

    // Randomize the order of the URLs
    const randomizedUrls = shuffleArray(urls);

    const totalPages = Math.ceil(count / limitNum);
    const hasNextPage = pageNum < totalPages;

    return res.status(200).json({ urls: randomizedUrls, hasNextPage });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};



const syncDataToSmartContract = async () => {
  const my_contractObj = new MyContract();
  const contract = my_contractObj.create_contract();
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY?? "", contract.provider);
  const contractWithSigner = contract.connect(wallet);

  // Sync users
  const users = await User.find();
  for (const user of users) {
      await contractWithSigner.addUser(user.walletAddress);
  }

  // Sync URLs
  const urls: SyncUrl[] = await Url.find().populate('submittedBy');
  for (const url of urls) {
      await contractWithSigner.addUrl(url.title, url.url, url.submittedBy.walletAddress, url.id);
  }

  // Sync tags
  const allTags: Synctag[] = await Tag.find().populate('createdBy');
  for (const tag of allTags) {
      await contractWithSigner.addTag(tag.name, tag.createdBy.walletAddress);
  }
}

module.exports = {
  create_user,
  login,
  recover_account,
  like,
  submit_url,
  get_all_users,
  get_specific_user,
  create_tag,
  delete_url,
  getUrlsByTags,
  get_all_tags,
  mix,
  syncDataToSmartContract
}
