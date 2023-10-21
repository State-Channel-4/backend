import {Request, Response } from 'express';
import {getMatchbyMatchID } from '../lib/matchmaking';
export const createMatch = async (req: Request, res: Response) => {
    
}
export const getMatch = async(req: Request, res: Response) => {
    const match = await getMatchbyMatchID(req.params.id)
    return res.status(200).json({match});
}