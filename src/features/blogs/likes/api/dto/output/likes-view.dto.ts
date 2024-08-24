export enum LikeStatus {
    None= 'None',
    Like = 'Like',
    Dislike = 'Dislike'
}

export type LikeDetailsViewDto = {
    addedAt: string,
    userId: string,
    login: string
}