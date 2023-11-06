// These types are generated from the typechain package. Try importing them from there

export interface TagToSync {
    name: string,
    createdBy: string,
    contentIds: string[],
}

export interface LikeToSync {
    url: string,
    liked: boolean,
    nonce: number,
    submittedBy: string,
}

export interface UserToSync {
    userAddress: string,
    numberOfLikes: number,
    submittedUrls: number[],
    registeredAt: number,
    numberofLikesInPeriod: number,
}

export interface UrlToSync {
    title: string,
    url: string,
    submittedBy: string,
    likes: number,
    tagIds: string[],
}

export interface MatchGroupType {
    key: number,
    users: string[],
}