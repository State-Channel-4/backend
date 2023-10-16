import { UserDocument } from "../models/schema"
import { MatchGroupDocument, MatchGroup } from "../models/matchGroup"
export const addToGroup = async (user: UserDocument, key: number): Promise<MatchGroupDocument> => {
    /*
    3 cases
    1. key does not exist. create the group
    2. user is not in group and key is different. add user to group
    3. user is already in group and key is different . update the document
    */
    let group = await MatchGroup.findOne({ key });
    let userInGroup = await MatchGroup.findOne({ users: user._id });
    let newGroup: MatchGroupDocument | null = null;
    if (!group && !userInGroup){
        newGroup = await MatchGroup.create({ key, users: [user._id] });
    } else if (group && !userInGroup){
        group.users.push(user._id);
        newGroup = await group.save();
    } else if (group && userInGroup) {
        // user exist and needs update. Remove user and then add to new key group
        newGroup = await MatchGroup.findOneAndUpdate({ key }, { $pull: { users: user._id } }, { new: true });
        console.log("removed from group : ", newGroup);
        newGroup = await MatchGroup.findOneAndUpdate({ key }, { $push: { users: user._id } }, { new: true });
        console.log("added to group : ", newGroup);
    }
    if(!newGroup) {
        throw new Error("Failed to create or update MatchGroup");
    }
    console.log("new group : ", newGroup);
    return newGroup;
}

