// create matches from MatchGroup
import { MatchGroup } from "../models/matchGroup"
import { Match } from "../models/match";
import { User } from "../models/schema";
/*
1. Create a new Match
2. Close the match
3. update the match states
4. conflict resolution

inside DB
"1" : [user1, user2]
"2" : [user3, user4]

*/
export const createMatch = async() => {
    let matches = [];
    const MatchGroups = await MatchGroup.find();
    for (const groupKey in MatchGroups) {
        if (MatchGroups.hasOwnProperty(groupKey)) {
            const group = MatchGroups[groupKey];
            console.log("group : ", group);
            if (group.users.length >= 2) {
                for(let i = 0; i < group.users.length; i++) {
                    for (let j = i+ 1; j < group.users.length; j++) {
                        const match = await Match.create(
                            { user1: group.users[i]._id, user2: group.users[j]._id },
                        )
                        // remove matched users from MatchGroups
                        MatchGroups[groupKey].users.splice(i, 1);
                        MatchGroups[groupKey].users.splice(i, j);
                        matches.push(match);
                        // update users matched field
                        await User.updateMany({ _id: { $in: [group.users[i]._id, group.users[j]._id] } }, { matched: true });
                    }
                }
            }
        }
    }
    // Match remaining users across groups
    let usersRemaining = [];
    for (const groupkey in MatchGroups) {
        const group = MatchGroups[groupkey];
        usersRemaining.push(group);
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
    return matches;

}
