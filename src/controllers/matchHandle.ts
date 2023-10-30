import {Request, Response } from 'express';
import {getMatchbyMatchID, generateMatch, getMatchbyUserID, updateMatchURLs, updateMatchStatus, updateUserCompleted } from '../lib/matchmaking';
import { getGroup } from '../lib/grouping';
import mongoose from 'mongoose';
export const createMatch = async (req: Request, res: Response) => {
    console.log("req.body : ", req.body);
    const userId = req.body.userId;
    const userGroup = await getGroup(userId);
    if(!userGroup)
    {
        return res.status(404).json({error: "User and group not found"});
    }
    const match = await generateMatch(userGroup);
    return res.status(200).json({match});
}
export const getMatch = async(req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.params.id);
    const match = await getMatchbyUserID(userId);
    return res.status(200).json({match});
}

export const updateMatch = async(req: Request, res: Response) => {
    console.log("Req body : ", req.body);
    const {matchId, userId, verifiedURLs} = req.body;
    const result = await updateMatchURLs(matchId, userId, verifiedURLs);
    if (result.acknowledged === true) {
        const matchStatus = await updateMatchStatus(matchId, 'running');
        console.log(matchStatus);
        return res.status(200).json({success: true});
    }
    return res.status(400).json({success: false});
}

export const markCompletion = async(req: Request, res: Response) => {
    let {userId} = req.body;
    userId = new mongoose.Types.ObjectId(userId);
    const updatedMatch = await updateUserCompleted(userId);
    return res.status(200).json({match: updatedMatch});
}