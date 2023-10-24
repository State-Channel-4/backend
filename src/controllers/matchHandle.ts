import {Request, Response } from 'express';
import {getMatchbyMatchID, generateMatch } from '../lib/matchmaking';
import { getGroup } from '../lib/grouping';
export const createMatch = async (req: Request, res: Response) => {
    console.log("req.body : ", req.body);
    const userId = req.body.urlId;
    const userGroup = await getGroup(userId);
    if(!userGroup)
    {
        return res.status(404).json({error: "User and group not found"});
    }
    const match = await generateMatch(userGroup);
    return res.status(200).json({match});
}
export const getMatch = async(req: Request, res: Response) => {
    const match = await getMatchbyMatchID(req.params.id)
    return res.status(200).json({match});
}