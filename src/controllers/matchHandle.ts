import {Request, Response } from 'express';
import {getMatchbyMatchID, generateMatch, getMatchbyUserID, updateMatchURLs, updateMatchStatus, updateUserCompleted, getDeadlockMatches } from '../lib/matchmaking';
import { getGroup } from '../lib/grouping';
import mongoose from 'mongoose';
export const createMatch = async (req: Request, res: Response) => {
    console.log("req.body : ", req.body);
    const {userId} = req.body;
    const userGroup = await getGroup(userId);
    if(!userGroup)
    {
        return res.status(404).json({error: "User and group not found"});
    }
    const match = await generateMatch(userGroup);
    if(!match) {
        return res.status(500).json({error: "Error in creating match or No match found"});
    }
    return res.status(200).json({match});
}
export const getMatch = async(req: Request, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.id);
        const match = await getMatchbyUserID(userId);
        return res.status(200).json({match});
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: `Invalid userId or error in creating match.  ${error}`});
    }
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

export const updateConcurStatus = async(req: Request, res: Response) => {
    // firt check if match.user1.completed and match.user2.completed === true.
    // if not then return, first complete the tasks
    const {matchId, userId, concurStatus} = req.body;
    let usdIdObj = new mongoose.Types.ObjectId(userId);
    let concurCodes = ['yes', 'no'];
    if (!concurCodes.includes(concurStatus)) {
        console.log("invalid concur status sent. ", concurStatus);
        return res.status(400).json({error: "invalid concur status sent. " + concurStatus});
    }
    const match = await getMatchbyMatchID(matchId);
    if(!match) {
        return res.status(404).json({error: "Match not found"});
    }
    if(match.user1.completed === true && match.user2.completed === true) {
        // mark the concur to give concurStatus
        if(match.user1.id.equals(usdIdObj)) {
            match.user1.concur = concurStatus;
        }
        else if(match.user2.id.equals(usdIdObj)) {
            match.user2.concur = concurStatus;
        }
        const result = await match.save();
        return res.status(200).json({success: true, match: result});
    }
    else {
        return res.status(400).json({error: "user1 and user2 must complete their task first. User1 : " + 
        match.user1.completed + " User2 : " + match.user2.completed + " not completed"});
    }
}

export const getDeadlockMatch = async(req: Request, res: Response) => {
    const match = await getDeadlockMatches();
    return res.status(200).json({match});
}