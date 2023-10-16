export interface TagToSync {
    name: string,
    createdBy: string,
}

export interface LikeToSync { 
    url: string,
    liked: boolean,
    nonce: number,
    submittedBy: string,
}

export interface UserToSync { 
    walletAddress: string,
}

export interface UrlToSync {
    title: string,
    url: string,
    submittedBy: string,
    tagIds: string[],
}

export interface MatchGroupType {
    key: number,
    users: string[],
}