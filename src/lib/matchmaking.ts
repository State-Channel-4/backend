// create matches from MatchGroup
import { MatchGroup, MatchGroupDocument } from "../models/matchGroup"
import { Match, MatchDocument } from "../models/match";
import { User, Url } from "../models/schema";
import mongoose, { Mongoose } from "mongoose";

/*
1. Create a new Match
2. Close the match
3. update the match states
4. conflict resolution

inside DB
"1" : [user1, user2]
"2" : [user3, user4]

*/

export const generateMatch = async(group : MatchGroupDocument): Promise<MatchDocument | null > => {
    let match = null;
    if(group.users.length >= 2) {
        for(let i = 0; i < group.users.length; i++) {
            for (let j = i+ 1; j < group.users.length; j++) {
                match = await Match.create(
                    { user1 :{id: group.users[i]._id}, user2: {id: group.users[j]._id}, threshold: group.key },                            
                )
                // update users matched field
                await User.updateMany({ _id: { $in: [group.users[i]._id, group.users[j]._id] } }, { matched: true });
                // remove users from matchgroup
                const res = await MatchGroup.updateMany({}, { $pull: { users: {$in: [group.users[i]._id, group.users[j]._id]} } });
                console.log("result : ", res);
            }
        }
    }
    else {
        console.log("less than 2 users in the group. Not enough to make a match");
        // match user across other group where key is greater than current group key and users > 0
        const otherGroup = await MatchGroup.findOne({ key: { $gt: group.key }, users: { $exists: true, $not: { $size: 0 } }});
        if(otherGroup) {
            match = await Match.create(
                { user1 :{id: group.users[0]._id}, user2: {id: otherGroup.users[0]._id}, threshold: group.key },
            )
            // update users matched field
            await User.updateMany({ _id: { $in: [group.users[0]._id, otherGroup.users[0]._id] } }, { matched: true });
            // remove users from matchgroup
            const res = await MatchGroup.updateMany({}, { $pull: { users: {$in: [group.users[0]._id, otherGroup.users[0]._id]} } });
            console.log("result : ", res);
        }
        else {
            console.log("no other group found");
        }

    }
    if(match != null) {
        // populate match
        match = await populateMatch(match);
    }
    return match;

}


export const generateAllMatches = async() => {
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

    // populate matches
    for (let i = 0; i < matches.length; i++) {
        matches[i] = await populateMatch(matches[i]);
    }
    return matches;

}

// populate match details from Match
export const populateMatch = async(matchObj : MatchDocument) : Promise<MatchDocument> => {
    // get all the urls submitted by user1 where verified is false and limit is threshold
    matchObj.user1.urls = await Url.find({ submittedBy: matchObj.user1.id, verified: false  }).limit(matchObj.threshold);
    matchObj.user2.urls = await Url.find({ submittedBy: matchObj.user2.id, verified: false }).limit(matchObj.threshold);
    matchObj.save();
    return matchObj;

}


// get match by userID
export const getMatchbyUserID = async(userID: mongoose.Types.ObjectId): Promise<MatchDocument | null> => {
    try {
        // Find a match where the user1 or user2 field contains the provided userID
        const match = await Match.findOne({
          $or: [
            { 'user1.id': userID },
            { 'user2.id': userID }
          ]
        });
        //console.log(`user : ${userID} match is ${match} `);    
        return match;
      } catch (error) {
        console.error('Error while retrieving the match:', error);
        return null;
      }
}

// get match by matchID
export const getMatchbyMatchID = async (matchID: string): Promise<MatchDocument> => {
    let matchObj = await Match.findOne({ _id: matchID });
    if(!matchObj) {
        throw new Error("match with provided matchID not found");
    }
    console.log({matchObj});
    return matchObj;
}



export const updateMatchURLs = async(matchID: string, userId: string, urls: Array<string>) => {
    let result = null;
    const match_id = new mongoose.Types.ObjectId(matchID);
    result = await Match.updateMany(
        {
          _id: match_id,
          $or: [
            { 'user1.urls.url': { $in: urls } },
            { 'user2.urls.url': { $in: urls } },
          ],
        },
        {
          $set: {
            'user1.urls.$[elem1].verified': true,
            'user2.urls.$[elem2].verified': true,
          },
        },
        {
          arrayFilters: [
            { 'elem1.url': { $in: urls } },
            { 'elem2.url': { $in: urls } },
          ],
        }
      );
    console.log("result : ", result);
    return result;
    // const updatedMatch = await Match.findById({_id: match_id});
    // if(!updatedMatch) {
    //     throw new Error("Invalid matchID. Match not found");
    // }
    // return updatedMatch;
}

export const updateMatchStatus = async(matchID: string, status: string) :Promise<MatchDocument | { error: string; }> => {
    let statusCodes = ['ready', 'running', 'completed', 'deadlock'];
    if (!statusCodes.includes(status)) {
        return {
            error: "Invalid status",
        }
    }
    
    const match = await Match.findById({ _id: matchID });
    console.log("updatematchstatus : ", match);

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

export const updateUserCompleted = async(userId: mongoose.Types.ObjectId, updateUser = "user1"):Promise<MatchDocument | { error: string; }>  => {
    const match = await getMatchbyUserID(userId);
    if(!match) {
        throw new Error("Invalid userId. Match not found");
    }
    if (match.user1.id.equals(userId)) {
        console.log("user1 completed");
        match.user1.completed = true;
    }
    else if (match.user2.id.equals(userId)) {
        console.log("user2 completed");
        match.user2.completed = true;
    }
    else {
        const user = await User.findById({_id: userId});
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

export const updateconcurStatus = async(matchId: string, userId: string, concurStatus: string) => {
    let match = await Match.findById({_id: matchId});
    if(!match) {
        throw new Error("Match not found with provided matchID");
    }
    if(match.user1.id.equals(userId)) {
        match.user1.concur = concurStatus;
    }
    else if (match.user2.id.equals(userId)) {
        match.user2.concur = concurStatus;
    }
    return await match.save();
}

export const closeMatch = async(matchId: string) => {
    let match = await Match.findById({_id: matchId});
    if(!match) {
        throw new Error("Match not found with provided matchID");
    }
    if(match.user1.concur === 'yes' && match.user2.concur === 'yes') {
        match.status = 'completed';
        await User.updateMany({ _id: { $in: [match.user1.id, match.user2.id] } }, { matched: false });
        match = await match.save()
    }
    return match;
}

export const getDeadlockMatches = async() => {
    // return all matches where match status is deadlock
    return await Match.find({status: 'deadlock'});
}