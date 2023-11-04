export type Profile = {
    id:  number,
    user_id: number,
    profile_picture: string,
    bio: string,
    level: number,
    points: number
}

export type Question = {
    question_id: number;
    user_id: number;
    title: string;
    body: string;
    views: number;
    created_at: Date;
    updated_at: Date;
};

export type Answer = {
    answer_id: number;
    question_id: number;
    user_id: number;
    body: string;
    upvotes: number;
    downvotes: number;
    accepted: boolean;
    created_at: Date;
    updated_at: Date;
  
}

export type Comment = {
  comment_id: number;
  user_id: number;
  question_id: number;
  answer_id: number;
  body: string;
  created_at: Date;
  updated_at: Date;
};

export type Tag = {
    tag_id: number;
    tag: string;
}
