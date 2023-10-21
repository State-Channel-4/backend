// create matches from MatchGroup
import { MatchGroup } from "../models/matchGroup"
import { Match, MatchDocument } from "../models/match";
import { User, Url } from "../models/schema";
import mongoose from "mongoose";
import { Request, Response } from 'express';
/*
1. Create a new Match
2. Close the match
3. update the match states
4. conflict resolution

inside DB
"1" : [user1, user2]
"2" : [user3, user4]

*/
export const createMatch = async(req: Request, res: Response) => {
    let matches = [];
    const MatchGroups = await MatchGroup.find();
    for (const groupKey in MatchGroups) {
        if (MatchGroups.hasOwnProperty(groupKey)) {
            const group = MatchGroups[groupKey];
            console.log("group  is ......... : ", group);
            if (group.users.length >= 2) {
                for(let i = 0; i < group.users.length; i++) {
                    for (let j = i+ 1; j < group.users.length; j++) {
                        const match = await Match.create(
                            { user1 :{id: group.users[i]._id}, user2: {id: group.users[j]._id}, threshold: parseInt(groupKey) },                            
                        )
                        // update users matched field
                        await User.updateMany({ _id: { $in: [group.users[i]._id, group.users[j]._id] } }, { matched: true });
                        // remove users from matchgroup
                        const res = await MatchGroup.updateMany({}, { $pull: { users: {$in: [group.users[i]._id, group.users[j]._id]} } });
                        console.log("result : ", res);

                        // remove matched users from MatchGroups array
                        MatchGroups[groupKey].users.splice(i, 1);
                        MatchGroups[groupKey].users.splice(i, j);
                        matches.push(match);
                    }
                }
            }
            else {
                console.log("not enough users in group : ", group.users);
            }
        }
    }
    // Match remaining users across groups
    let usersRemaining = [];
    for (const groupkey in MatchGroups) {
        const group = MatchGroups[groupkey];
        if(group.users.length > 0) {
            usersRemaining.push(group);
        }
    }
    while (usersRemaining.length >= 2)
    {
        const match = await Match.create(
            { user1: usersRemaining[0]._id, user2: usersRemaining[1]._id },
        )
        matches.push(match);
        usersRemaining.splice(0, 2);
    }
    console.log("final matches : ", matches);
    return res.status(201).json({ matches: matches });

}

// populate match details from Match
export const populateMatch = async(matchObj : MatchDocument) : Promise<MatchDocument> => {
    // get all the urls submitted by user1 where verified is false and limit is threshold
    matchObj.user1.urls = await Url.find({ submittedBy: matchObj.user1.id, verified: false  }).limit(matchObj.threshold);
    matchObj.user2.urls = await Url.find({ submittedBy: matchObj.user2.id, verified: false }).limit(matchObj.threshold);
    return matchObj;

}


// get match by matchID
export const getMatchbyMatchID = async (matchID: string) => {
    let matchObj = await Match.findOne({ _id: matchID });
    if(!matchObj) {
        throw new Error("match with provided matchID not found");
    }
    const match = await populateMatch(matchObj);
    console.log({match});
    return match;
}


export const updateMatchStatus = async(matchID: string, status: string) :Promise<MatchDocument | { error: string; }> => {
    if (status in ['ready', 'running', 'completed', 'deadlock'] === false) {
        return {
            error: "Invalid status",
        }
    }
    const match = await Match.findOne({ _id: matchID });

    if(!match) {
        throw new Error("Match not found");
    }
    try {
        match.status = status;
        await match.save();
        return match;
    } catch (error) {
        console.error(error);
        return {
            error: "Match update failed",
        };
    }
}

export const updateUserCompleted = async(matchID: string, userID: mongoose.Types.ObjectId, updateUser = "user1"):Promise<MatchDocument | { error: string; }>  => {
    const match = await Match.findOne({ _id: matchID });
    if(!match) {
        throw new Error("Invalid matchID. Match not found");
    }
    if (match.user1.id === userID) {
        match.user1.completed = true;
    }
    else if (match.user2.id === userID) {
        match.user2.completed = true;
    }
    else {
        const user = await User.findById({_id: userID});
        if (user?.role === 'mod') {
            if(updateUser === 'user1') {
                match.user1.completed = true;
            } else if (updateUser === 'user2') {
                match.user2.completed = true;
            }
            else {
                console.log("invalid user");
            }
        } else {
            console.error("Cannot change completion status. No permission");
            return {
                error : "Cannot change completion status. No permission",
            }
        }
    }
    match.status = 'running';
    return await match?.save();
}

export const markMatchCompleted = async(matchID: string) => {
    let match = await Match.findById({_id: matchID});
    if(!match) {
        throw new Error("Match not found with provided matchID");
    }
    if(match.user1.completed === true && match.user2.completed === true) {
        match.status = 'completed';
        await User.updateMany({ _id: { $in: [match.user1.id, match.user2.id] } }, { matched: false });
        match = await match.save()
    }
    return match;    

}
