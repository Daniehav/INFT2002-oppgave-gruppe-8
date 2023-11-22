import React, {useState, useEffect, useContext} from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {questionService, answerService, tagService, commentService, profileService, favoriteService} from '../service'
import { Question, Answer, Tag, QuestionComment, Profile, AnswerComment} from '../types'
import { useParams, Link } from 'react-router-dom';
import { ProfileContext, AuthContext } from '../context/Context';
import Pfp from './Pfp';

import sortDown from '../assets/sort-down.svg'
import sortUp from '../assets/sort-up.svg'
import downvote from '../assets/downvote.svg'
import upvote from '../assets/upvote.svg'
import accepted from '../assets/accepted.svg'
import favorite from '../assets/favorite.svg'
import favorited from '../assets/favorited.svg'
import { formatDate } from './Questions';
import {UsernamePfp} from './Questions'
import { Comments, CreateComment } from './Comments';

export function Answers({question, setShowCreateComment}: {question: Question, setShowCreateComment: React.Dispatch<React.SetStateAction<boolean>>}){

    const [answers, setAnswers] = useState<Answer[]>([])
    const {profile} = useContext(ProfileContext)
    const {isAuthenticated} = useContext(AuthContext)
    const [descending, setDescending] = useState(true)
    const [sortBy, setSortBy] = useState<'score' | 'latest'>('score')
    const [userHasVoted, setUserHasVoted] = useState<number[]>([])
    const [favorites, setFavorites] = useState<number[]>([])

    
    

    useEffect(() => {
        
        sortAnswers(answers, descending)
    }, [sortBy, descending]);

    const sortAnswers = (answers: Answer[], descending: boolean) => {
        let sorted;
    
        switch (sortBy) {
          case 'score':
            sorted = [...answers].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
            break;
          case 'latest':
            sorted = [...answers].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
            break;
          default:
            sorted = answers;
        }
    
        if (!descending) {
          sorted.reverse();
        }
    
        setAnswers(sorted);
    };


    useEffect(() => {
        const fetch = async() => {
            if(!question.question_id) return
            try {
                const answers = await answerService.getAll(question.question_id)
                sortAnswers(answers, true)
                const favorites = await favoriteService.getFavoriteIds()
                setFavorites(favorites)
                setDescending(true)
            } catch (error) {
                console.error(error);
            }
        }
        fetch()
    }, [question]);

    

    const acceptAnswer = async(answer: Answer) => {
        if(question.user_id != profile.user_id) return;
        setAnswers(prev => {
            return prev.map(a => {
                if(a.answer_id == answer.answer_id) {
                    return {...answer, accepted: !answer.accepted}
                } else {
                    return a
                }
            })
        })
        await questionService.accept(question.question_id, answer.answer_id, answer.user_id)
    }
    const favoriteAnswer = async(answer: Answer) => {
        if(answer.user_id == profile.user_id) return;
        setFavorites(prev => [...prev, answer.answer_id])
        const id = await favoriteService.setFavorite(answer.answer_id)
    }

    const vote = async (answer: Answer, vote: 'upvote' | 'downvote') => {
        if(answer.user_id == profile.user_id || userHasVoted.includes(answer.answer_id)) return
        setUserHasVoted(prev => [...prev, answer.answer_id])
        setAnswers(prev => {
            return prev.map(a => {
                if(a.answer_id == answer.answer_id) {
                    return {...answer, upvotes: vote == 'upvote'? answer.upvotes+1 : answer.upvotes,  downvotes: vote == 'downvote'? answer.downvotes + 1 : answer.downvotes}
                } else {
                    return a
                }
            })
        })
        await answerService.vote(answer.answer_id, vote)
    }

    const removeAnswer = (answer: Answer) => {
        setAnswers(prev => prev.filter(a => a.answer_id != answer.answer_id))
    }

    const answersElements = answers.map((answer, i) => {
        const isFavorite = favorites.includes(answer.answer_id)
        return <div key={i} className='wide-75'>
            <AnswerDetails answer={answer} question={question} accept={acceptAnswer} vote={vote} favoriteAnswer={favoriteAnswer} isFavorite={isFavorite} removeAnswer={removeAnswer}/>
        </div>
    })

    
    return(
        <>
            <div className='wide-75'>
                <div className='card bg-white row'>
                    <p>{answers.length} answers</p>
                    <button className={`text-black ${sortBy == 'score'? 'select-underline' : ''}`} onClick={() => setSortBy('score')}>Sort by score</button>
                    <img className='icon-s pointer' onClick={() => setDescending(prev => !prev)} src={descending? sortDown : sortUp} alt={descending? 'desc' : 'asc'} />
                    <button className={`text-black ${sortBy == 'latest'? 'select-underline' : ''}`} onClick={() => setSortBy('latest')}>Sort by latest</button>
                    {profile.user_id != question.user_id && isAuthenticated &&<>
                        <Link to={`/question/${question.question_id}/answer/create`} className="button bg-light-grey text-black fs-3">Post answer</Link>
                        <button onClick={() => setShowCreateComment(true)} className="button bg-light-grey text-black fs-3">Post comment</button>
                    </>}
                </div>
            </div>
            {answersElements}
        </> 
            
    )
} 

type AnswerDetailsProps = {
    answer: Answer,
    question: Question, 
    vote: (answer: Answer, vote: 'upvote' | 'downvote') => void,
    accept: (answer: Answer) => void,
    favoriteAnswer: (answer: Answer) => void,
    isFavorite: boolean,
    removeAnswer: (answer: Answer) => void
}

export function AnswerDetails({answer, question, vote, accept, favoriteAnswer, isFavorite, removeAnswer}: AnswerDetailsProps) {

    const {profile} = useContext(ProfileContext)
    const {isAuthenticated} = useContext(AuthContext)
    const [showCreateAnswerComment, setShowCreateComment] = useState<number | false>(false)
    const [comments, setComments] = useState<AnswerComment[]>([])

    const navigate = useNavigate()

    useEffect(() => {
        if(!answer.answer_id) return
        const fetch = async () => {
            const comments = await commentService.get('answer',answer.answer_id)
            setComments(comments as AnswerComment[])
        }
        fetch()
    }, []);

    const addComment = (comment: string, commentId: number) => {
        if(!comment || !commentId) return
        setShowCreateComment(false)
        const answerComment = {body: comment, comment_id: commentId, user_id: profile.user_id, answer_id: answer.answer_id} as AnswerComment
        setComments(prev => [...prev, answerComment])
    } 
    const editComment = (comment: string, commentId: number) => {
        if(!comment || !commentId) return
        setComments(prev => prev.map(c => {
            if(c.comment_id == commentId){
                return {...c, body: comment}
            } else {
                return c
            }
        }))
    } 
    //removes from state to update component
    const deleteComment = (commentId: number) => {
        if(!commentId) return
        setComments(prev => prev.filter((c) => c.comment_id != commentId)) 
    } 


    const postedQuestion = question.user_id == profile.user_id
    const postedAnswer = answer.user_id == profile.user_id 
    let acceptIconClass = answer.accepted? 'accepted' : postedQuestion? 'accept' : 'vis-hide'
    const favoriteIcon = isFavorite? favorited : favorite

    const deleteAnswer = async (answerId: number) => {
        removeAnswer(answer)
        await answerService.delete(answerId)
        navigate('/question/'+ question.question_id)
    }

    return ( <>
        <div className='card bg-white wide-100'>
            <div className='row'>
                <UsernamePfp userId={answer.user_id} withPfp={true} />
                {!postedAnswer && <img onClick={() => favoriteAnswer(answer)} className={`icon-m pointer`} src={favoriteIcon} alt={isFavorite? 'favorited' : 'not-favorited'}/>}
                <img onClick={() => accept(answer)} className={`icon-m ${acceptIconClass} ${postedQuestion? 'pointer' : ''}`} src={accepted} alt={answer.accepted? 'accepted' : 'not-accepted'}/>
                <p className='fs-5'>Asked {formatDate(answer.created_at)}</p>
                <p className='fs-5'>Modified {formatDate(answer.updated_at)}</p>
            </div>
            <div className="row space-between">
                <div className='row'>
                    <div className='flex-vert align-center gap-05'>
                        {!postedAnswer && <img onClick={() => vote(answer, 'upvote')} className='icon-s pointer' src={upvote} alt="upvote" />}
                        <p className='fs-3 vote-count'>{answer.upvotes - answer.downvotes}</p>
                        {!postedAnswer && <img onClick={() => vote(answer, 'downvote')} className='icon-s pointer' src={downvote} alt="downvote" />}
                    </div>
                    <p className='text-body'>{answer.body}</p>
                </div>
                <div className="flex-vert align-start gap-1">
                    {answer.user_id != profile.user_id && isAuthenticated && <button onClick={() => setShowCreateComment(answer.answer_id)} className="button bg-light-grey text-black fs-3">Post comment</button>}
                </div>
            </div>
            <div>
                <Comments comments={comments} editComment={editComment} removeComment={deleteComment} parent={'answer'} />
            </div>
            {postedAnswer && 
            <div className='row justify-end'>
                <Link className='button bg-light-grey text-black fs-4' to={`/question/${question.question_id}/answer/${answer.answer_id}/edit`}>Edit</Link>
                <button className='button bg-light-grey text-black fs-4' onClick={() => deleteAnswer(answer.answer_id)}>Delete</button>
            </div>}
        </div>
        {showCreateAnswerComment == answer.answer_id && <CreateComment parent='answer' parentId={answer.answer_id} addComment={addComment} show={setShowCreateComment} />}
    </>
)

}

export function CreateAnswer() {

    const [answer, setAnswer] = useState('')
    const navigate = useNavigate()
    const params = useParams()

    const post = async () => {
        if(!answer || !params.id ) return
        const questionId = parseInt(params.id)
        const answerId = await answerService.create(questionId, answer)
        navigate('/question/'+ questionId)
    }

    return(
        <div className='card wide-75 bg-white row'>
            <textarea className='textarea textarea--answer wide-75' value={answer} onChange={e => setAnswer(e.currentTarget.value)}></textarea>
            <button className='button bg-accent text-WHITE fs-3' onClick={post}>Post answer</button>
        </div>
    )
}

export function EditAnswer() {
    const params = useParams()
    const answerId = parseInt(params.answerId as string)
    const id = parseInt(params.id as string)
    const [answer, setAnswer] = useState<Answer>({} as Answer)
    const navigate = useNavigate()

    useEffect(() => {
        if(!answerId) return
        const fetch = async () => {
            const answer = await answerService.get(answerId)
            setAnswer(answer)
        }
        fetch()
    }, [answerId]);

    const edit =async () => {
        if(!answer.body) return
        await answerService.edit(answer);
        navigate('/question/'+ id)
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        
        setAnswer(prev => {
            return { ...prev, body: e.target.value} as Answer
        })
    }

    return(
        <div className='card wide-75 bg-white row'>
            <textarea className='textarea textarea--answer wide-75' value={answer.body} onChange={handleChange}></textarea>
            <div className="flex-vert align-start gap-1">
                <button className='button bg-light-grey text-black fs-3' onClick={() => navigate('/question/'+id)}>Cancel</button>
                <button className='button bg-accent text-WHITE fs-3' onClick={edit}>Update answer</button>
            </div>
        </div>
    )
}

