import { UserDocument } from "../models/schema"
import { MatchGroupDocument, MatchGroup } from "../models/matchGroup"
export const addToGroup = async (user: UserDocument, key: number): Promise<boolean> => {
    /*
    3 cases
    1. key does not exist 
    2. user is already in group and key is different . update the document
    3. user is not in group and key is different. add user to group
    */
    const group = await MatchGroup.findOne({ key });
    if (!group) {
        return false;
    }
}

