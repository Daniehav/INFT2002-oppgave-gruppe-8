export type Profile = {
    display_name: string,
    id:  number,
    user_id: number,
    profile_picture: string,
    bio: string,
    level: number,
    points: number,
    username: string
}

export type Question = {
    question_id: number;
    user_id: number;
    title: string;
    body: string;
    views: number;
    created_at: Date;
    updated_at: Date;
    answer_count?: number;
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
    question_title?: string;
}

export type Parent = 'question' | 'answers'

interface Comment{
    comment_id: number;
    user_id: number;
    body: string;
    created_at: Date;
    updated_at: Date;
}

export interface QuestionComment extends Comment {
    question_id: number;
};
export interface AnswerComment extends Comment {
    answer_id: number;
};

export type Tag = {
    tag_id: number;
    name: string;
    count: number;
    created_at: Date;
    updated_at: Date;
}
