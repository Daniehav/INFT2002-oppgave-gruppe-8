import React, {useState, useEffect, useContext} from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {questionService, answerService, tagService, commentService, profileService, favoriteService} from '../service'
import { Question, Answer, Tag, QuestionComment, Profile, AnswerComment} from '../types'
import { useParams, Link } from 'react-router-dom';
import { ProfileContext } from '../context/Context';
import { UsernamePfp, formatDate } from './Questions';

export function Comments({comments, removeComment, editComment, parent}: {comments: QuestionComment[] | AnswerComment[], removeComment: (commentId: number) => void, editComment: (comment: string,commentId: number) => void, parent: 'question' | 'answer'}){
    const {profile} = useContext(ProfileContext)
    const [showEdit, setShowEdit] = useState<number | false>(false)
    

    const deleteComment = async(c: QuestionComment | AnswerComment) => {
        await commentService.delete(c.comment_id, parent)
        removeComment(c.comment_id)
    }

    const commentElements = comments.map((c,i) => {
        console.log(profile);
        
        const postedComment = c.user_id == profile.user_id
        const edit = c.comment_id == showEdit
        return (
            <div key={i} className='row space-between'>
                {!edit? <> <p className='text-body'>{c.body}</p> 
                <div className='row gap-1'>
                    <UsernamePfp userId={c.user_id} withPfp={false} />
                    <p>{formatDate(c.updated_at)}</p>
                    {postedComment && <><button onClick={() => setShowEdit(c.comment_id)} className='button bg-light-grey text-black fs-4'>Edit</button>
                    <button onClick={() => deleteComment(c)} className='button bg-light-grey text-black fs-4'>Delete</button></>}
                </div> </>:
                c.comment_id && <EditComment oldComment={c.body} parent={parent} commentId={c.comment_id} show={setShowEdit} editComment={editComment} />
                }
            </div>
        )
    })
    
    return(
        commentElements.length > 0? <div className={`${parent == 'answer'? 'border-top' : ''}  border-bottom`}>
            {commentElements}
        </div> : <></>
    )
}


export function CreateComment({parent, parentId, show, addComment}: {parent: string, parentId: number, show: React.Dispatch<React.SetStateAction<any>>, addComment: (comment: string, commentId: number) => void}) {

    const [comment, setComment] = useState('')

    const post = async () => {
        if(!comment || !parent || !parentId) return
        const answerId = await commentService.create(parent,parentId,comment)
        addComment(comment, answerId)
    }
    return(
        <div className='card wide-100 bg-white row'>
            <textarea className='textarea textarea--comment wide-75' value={comment} onChange={e => setComment(e.currentTarget.value)}></textarea>
            <div className="flex-vert align-start gap-1">
                <button className='button bg-light-greay text-black fs-3' onClick={() => show(false)}>Cancel</button>
                <button className='button bg-accent text-WHITE fs-3' onClick={post}>Post comment</button>
            </div>
        </div>
    )
}
export function EditComment({oldComment, parent, commentId,show, editComment}: {oldComment: string, parent: string, commentId: number, show: React.Dispatch<React.SetStateAction<false | number>>, editComment: (comment: string, commentId: number) => void}) {

    const [comment, setComment] = useState(oldComment)

    const edit = async () => {
        if(!comment || !parent) return
        await commentService.edit(commentId, parent,comment)
        show(false)
        editComment(comment, commentId)
    }
    return(
        <div className='wide-100 row'>
            <textarea className='textarea textarea--comment wide-75' value={comment} onChange={e => setComment(e.currentTarget.value)}></textarea>
            <div className="flex-vert align-start gap-1">
                <button className='button bg-light-grey text-black fs-4' onClick={() => show(false)}>Cancel</button>
                <button className='button bg-accent text-WHITE fs-4' onClick={edit}>Update comment</button>
            </div>
        </div>
    )
}
