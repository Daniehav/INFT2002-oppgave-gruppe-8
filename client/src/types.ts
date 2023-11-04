export type Profile = {
    id:  number,
    user_id: number,
    profile_picture: string,
    bio: string,
    level: number,
    points: number
}
// i think the solution to date might be to initially treat it as a string and then convert it when necessary using the Date() constructor
export type Question = {
    id: number,
    user_id: number,
    title: string,
    body: string,
    views: string,
    created_at: string,
    updated_at: string
}