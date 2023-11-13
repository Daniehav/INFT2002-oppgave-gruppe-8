import React, {useState, useEffect, useContext} from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {questionService, answerService, tagService, commentService, profileService, favoriteService} from '../service'
import { Question, Answer, Tag, QuestionComment, Profile, AnswerComment} from '../types'
import { useParams, Link } from 'react-router-dom';
import { ProfileContext } from '../context/Context';
import Pfp from './Pfp';
import sortDown from '../assets/sort-down.svg'
import sortUp from '../assets/sort-up.svg'
import downvote from '../assets/downvote.svg'
import upvote from '../assets/upvote.svg'
import accepted from '../assets/accepted.svg'
import favorite from '../assets/favorite.svg'
import favorited from '../assets/favorited.svg'


export function QuestionDetails() {
    const params = useParams()
    const location = useLocation()
    const id = parseInt(params.id as string)
    const noOutlet = !location.pathname.includes('answer')

    const {profile} =  useContext(ProfileContext)
    const [question, setQuestion] = useState<Question>({} as Question)
    const [questionTags, setQuestionTags] = useState<Tag[]>([])
    

    useEffect(() => {
        const fetchQuestion = async () => {
            if(isNaN(id)) return
            
            const question = await questionService.get(id)
            setQuestion(question)
            const tags = await tagService.getQuestionTags(id)
            setQuestionTags(tags)
        }
        fetchQuestion()
    }, [id]);

    const deleteQuestion = async () => {
        await questionService.delete(question.question_id)
    }


    const tagsElements = questionTags.map((tag, i) => <div key={i} className='tag fs-5'>{tag.name}</div>)

    return <div className='question-page'>
        <div className="wide-75 card bg-white">
            <div className='question-header'>
                <div className="row">
                    <UsernamePfp userId={question.user_id} withPfp={true} />
                </div>
                <p className='fs-1'>{question.title}</p>
                <div className='row'>
                    <p className='fs-5'>Asked {formatDate(question.created_at)}</p>
                    <p className='fs-5'>Modified {formatDate(question.updated_at)}</p>
                    <p className='fs-5'>Viewed {question.views} {question.views == 1? 'time' : 'times'}</p>
                    <div className='tags'>{tagsElements}</div>
                    {profile.user_id == question.user_id &&<><Link className='button bg-light-grey text-black fs-4' to={`/question/${question.question_id}/edit`}>Edit</Link>
                    <button className='button bg-light-grey text-black fs-4' onClick={deleteQuestion}>Delete</button></>}
                </div>
            </div>
            <p className='fs-4 text-body'>{question.body}</p>
        </div>
        <Comments parent={question} />

        <Outlet />

        {noOutlet && <Answers question={question} />}
    </div>
}

export function Answers({question}: {question: Question}){

    const [answers, setAnswers] = useState<Answer[]>([])
    const {profile} = useContext(ProfileContext)
    const [descending, setDescending] = useState(true)
    const [sortBy, setSortBy] = useState<'score' | 'latest'>('score')
    const [userHasVoted, setUserHasVoted] = useState(false)
    const [favorites, setFavorites] = useState<number[]>([])
    const [showCreateComment, setShowCreateComment] = useState(false)
    const [showCreateAnswerComment, setShowCreateAnswerComment] = useState<number | false>(false)
    const navigate = useNavigate()

    useEffect(() => {
        if(!question.question_id) return
        const fetch = async() => {
            const answers = await answerService.getAll(question.question_id)
            setAnswers(answers)
            const favorites = await favoriteService.getFavoriteIds()
            setFavorites(favorites)
            console.log(favorites);
            
        }
        fetch()
    }, [question]);

    useEffect(() => {
        setAnswers(prev => {
            return prev.sort((a, b) => {
                const scoreA = a.upvotes - a.downvotes
                const scoreB = b.upvotes - b.downvotes
                const dateA = new Date(a.updated_at).getTime()
                const dateB = new Date(b.updated_at).getTime()
                if(sortBy == 'score') return descending? scoreB - scoreA : scoreA - scoreB
                if(sortBy == 'latest') return descending? dateB - dateA : dateA - dateB
                return 0
            });
        })
    }, [sortBy, descending]);

    const acceptAnswer = async(answer: Answer) => {
        if(answer.user_id == profile.user_id || question.user_id != profile.user_id) return;
        setAnswers(prev => {
            return prev.map(a => {
                if(a.answer_id == answer.answer_id) {
                    return {...answer, accepted: !answer.accepted}
                } else {
                    return a
                }
            })
        })
        const accepted = await questionService.accept(question.question_id, answer.answer_id, answer.user_id)
    }
    const favoriteAnswer = async(answer: Answer) => {
        if(answer.user_id == profile.user_id) return;
       
        const favorited = await favoriteService.setFavorite(answer.answer_id)
        setFavorites(prev => [...prev, answer.answer_id])
    }

    const vote = async (answer: Answer, vote: 'upvote' | 'downvote') => {
        if(answer.user_id == profile.user_id || userHasVoted) return
        setUserHasVoted(true)
        setAnswers(prev => {
            return prev.map(a => {
                if(a.answer_id == answer.answer_id) {
                    return {...answer, upvotes: vote == 'upvote'? answer.upvotes+1 : answer.upvotes,  downvotes: vote == 'downvote'? answer.downvotes + 1 : answer.downvotes}
                } else {
                    return a
                }
            })
        })
        const voted = await answerService.vote(answer.answer_id, vote)
    }

    const deleteAnswer = async (answerId: number) => {
        await answerService.delete(answerId)
        navigate('/question/'+ question.question_id)
    }

    const answersElements = answers.map((answer, i) => {
        const postedQuestion = question.user_id == profile.user_id
        const postedAnswer = answer.user_id == profile.user_id
        let acceptIconClass = answer.accepted? 'accepted' : postedQuestion? 'accept' : 'vis-hide'
        const favoriteIcon = favorites.includes(answer.answer_id)? favorited : favorite

        return ( <div key={i}>
            <div className='card bg-white wide-100'>
                <div className='row'>
                    <UsernamePfp userId={answer.user_id} withPfp={true} />
                    <img onClick={() => favoriteAnswer(answer)} className={`icon-m pointer`} src={favoriteIcon} alt=""/>
                    <img onClick={() => acceptAnswer(answer)} className={`icon-m ${acceptIconClass} pointer`} src={accepted} alt=""/>
                    <p className='fs-5'>Asked {formatDate(answer.created_at)}</p>
                    <p className='fs-5'>Modified {formatDate(answer.updated_at)}</p>
                </div>
                <div className="row space-between">
                    <div className='row'>
                        <div className='flex-vert align-center gap-05'>
                            <img onClick={() => vote(answer, 'upvote')} className='icon-s pointer' src={upvote} alt="" />
                            <p className='fs-3 vote-count'>{answer.upvotes - answer.downvotes}</p>
                            <img onClick={() => vote(answer, 'downvote')} className='icon-s pointer' src={downvote} alt="" />
                        </div>
                        <p className='text-body'>{answer.body}</p>
                    </div>
                    <div className="flex-vert align-start gap-1">
                        {answer.user_id != profile.user_id && <button onClick={() => setShowCreateAnswerComment(answer.answer_id)} className="button bg-light-grey text-black fs-3">Post comment</button>}
                    </div>
                </div>
                <div>
                    <Comments parent={answer} />
                </div>
                {postedAnswer && 
                <div className='row justify-end'>
                    <Link className='button bg-light-grey text-black fs-4' to={`/question/${question.question_id}/answer/${answer.answer_id}/edit`}>Edit</Link>
                    <button className='button bg-light-grey text-black fs-4' onClick={() => deleteAnswer(answer.answer_id)}>Delete</button>
                </div>}
            </div>
            {showCreateAnswerComment == answer.answer_id && <CreateComment parent='answer' parentId={answer.answer_id} show={setShowCreateAnswerComment} />}
        </div>
        )
    })

    
    return(
        <div className='wide-75'>
            {showCreateComment && <CreateComment parent={'question'} parentId={question.question_id} show={setShowCreateComment}/>}
            <div className='card bg-white row'>
                <p>{answers.length} answers</p>
                <button className='text-black' onClick={() => setSortBy('latest')}>Sort by latest</button>
                <img className='icon-s pointer' onClick={() => setDescending(prev => !prev)} src={descending? sortDown : sortUp} alt="" />
                <button className='text-black' onClick={() => setSortBy('score')}>Sort by score</button>
                {profile.user_id != question.user_id && <>
                    <Link to={`/question/${question.question_id}/answer/create`} className="button bg-light-grey text-black fs-3">Post answer</Link>
                    <button onClick={() => setShowCreateComment(true)} className="button bg-light-grey text-black fs-3">Post comment</button>
                </>}
            </div>
            {answersElements}
        </div> 
            
    )
} 

function Comments({parent}: {parent: Question | Answer}){
    const parentType = parent.hasOwnProperty('title')? 'question' : 'answer'
    const [comments, setComments] = useState<QuestionComment[] | AnswerComment[]>([])
    const {profile} = useContext(ProfileContext)
    const [showEdit, setShowEdit] = useState<number | false>(false)
    useEffect(() => {

        if(!parent.question_id) return
        const fetch = async () => {
            
            if(parent.hasOwnProperty('title')){
                const question = parent as Question
                const comments = await commentService.get('question',question.question_id)
                setComments(comments)
            } else{
                const answer = parent as Answer
                const comments = await commentService.get('answer',answer.answer_id)
                setComments(comments)
            }
        }
        fetch()
    }, [parent]);

    const deleteComment = async(c: QuestionComment | AnswerComment) => {
        await commentService.delete(c.comment_id, parentType)
    }

    // const editComment = async(c: QuestionComment | AnswerComment) => {
    //     await commentService.edit(c.comment_id, parentType,)
    // }

    const commentElements = comments.map((c,i) => {
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
                c.comment_id && <EditComment parent={parentType} commentId={c.comment_id} show={setShowEdit} />
                }
            </div>
        )
    })
    
    return(
        commentElements.length > 0? <div className={`${parentType == 'question'? 'card bg-white wide-75' : 'border-top'}  border-bottom`}>
            {commentElements}
        </div> : <></>
    )
}

function UsernamePfp ({userId, withPfp}: {userId: number, withPfp: boolean}){

    const [profile, setProfile] = useState<Profile>({} as Profile)
    
    useEffect(() => {
        if(!userId) return
        const fetch =  async() => {
            const profile = await profileService.get(userId)
            setProfile(profile)
        }
        fetch()
    }, [userId]);
    
    return(
        <>
            {withPfp && <Pfp size='s' pfp={profile.profile_picture} level={profile.level} />}
            <p className='fs-4'>{profile.display_name}</p>
        </>
    )
} 

export function CreateQuestion() {

    const {profile} = useContext(ProfileContext)
    const navigate = useNavigate()

    const [question, setQuestion] = useState<Question>({} as Question)
    const {title, body} = question
    const [questionTags, setQuestionTags] = useState<Tag[]>([])
    const tagIds = questionTags.map(t => t.tag_id)
    const [allTags, setAllTags] = useState<Tag[]>([])
    const [tagInput, setTagInput] = useState('')

    useEffect(() => {
        fetchTags()
    },[])
    
    const fetchTags = async () => {
        const allTags = await tagService.getAll()
        setAllTags(allTags)
    }
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.currentTarget
        setQuestion(prev => {
            return {
                ...prev,
                [name]: value
            }
        })
    }

    const addTag = async () => {
        if(!tagInput) return
        const tag = allTags.find(t => t.name == tagInput)
        if(tag) {
            selectTags(tag)
        } else {
            const tag = await tagService.create(tagInput)
            if(!tag) return
            fetchTags()
            selectTags(tag)
            setTagInput('')
        }
    }

    const selectTags = (tag: Tag) => {
        setQuestionTags(prev => [tag, ...prev])
        setTagInput('')
    }

    const deselectTags = (tag: Tag) => {
        
        setQuestionTags(prev => prev.filter(t => t.tag_id != tag.tag_id))
    }

    const selectedTagElements = questionTags.map((tag, i) => <button className='tag bg-accent' key={i} onClick={() => deselectTags(tag)}>{tag.name}</button>)


    const create = async () => {
        if(!profile.user_id || title || body || tagIds)
        try {
            const questionId = await questionService.create(profile.user_id, title, body, tagIds)
            navigate('/question/' + questionId)
        } catch (error) {
            
        }
    }

    const regexPattern = tagInput
        .replace(/\s+/g, '\\s*')
        .split('')
        .join('\\s*');
    const filter = new RegExp(regexPattern, 'i');


    const tagOptions = allTags.filter(t => filter.test(t.name) && !questionTags.map(t => t.tag_id).includes(t.tag_id)).slice(0,5).map((t,i) => <button className='fs-3 tag-option' key={i} onClick={() => selectTags(t)}>{t.name}</button>)


    return(
        <div className='card bg-white wide-75 flex-vert'>
            <table className='table gap-1'>
                <tbody>
                    <tr>
                        <td><label htmlFor="title">Title:</label></td>
                        <td className='wide-100'><input className='input wide-75' name='title' type="text" value={question.title} onChange={handleChange}></input></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td className='wide-100'><textarea className='textarea textarea--question wide-100' name='body' onChange={handleChange} value={question.body}></textarea></td>
                    </tr>
                    <tr className='tag-row'>
                        <td>Tags</td>
                        <td className='relative'>
                            <div className='tag-search wide-25 bg-white'>
                                <input value={tagInput} onChange={e => setTagInput(e.currentTarget.value)} className='input--tag' type="text" />
                                {tagInput.length > 0 && <div className='tag-options'>{tagOptions}</div>}
                            </div>
                            <button className='button add-tag bg-accent text-WHITE' onClick={addTag}>Add tag</button>
                        </td>
                    </tr>

                </tbody>
            </table>
            <div className='tags'>{selectedTagElements}</div>
            <button className={`button fs-3 ${title && body && tagIds.length > 0? 'bg-accent text-WHITE' : 'bg-light-grey text-black'} align-end`} onClick={create}>Post</button>
        </div>  

    )
}



export function EditQuestion() {
    const params = useParams()
    const id = parseInt(params.id as string)
    const {profile} = useContext(ProfileContext)
    const navigate = useNavigate()

    const [question, setQuestion] = useState<Question>({} as Question)
    const {title, body} = question
    const [questionTags, setQuestionTags] = useState<Tag[]>([])
    const [newTags, setNewTags] = useState<Tag[]>([])
    const tagIds = questionTags.map(t => t.tag_id)
    const [allTags, setAllTags] = useState<Tag[]>([])
    const [tagInput, setTagInput] = useState('')

    useEffect(() => {
        fetchTags()
    },[])
    
    const fetchTags = async () => {
        const allTags = await tagService.getAll()
        setAllTags(allTags)
    }
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.currentTarget
        setQuestion(prev => {
            return {
                ...prev,
                [name]: value
            }
        })
    }

    const addTag = async () => {
        if(!tagInput) return
        const tag = allTags.find(t => t.name == tagInput)
        if(tag) {
            selectTags(tag)
        } else {
            const tag = await tagService.create(tagInput)
            if(!tag) return
            fetchTags()
            selectTags(tag)
            setTagInput('')
        }
    }

    const selectTags = (tag: Tag) => {
        setNewTags(prev => [tag, ...prev])
        setTagInput('')
    }

    const deselectTags = (tag: Tag) => {
        
        setNewTags(prev => prev.filter(t => t.tag_id != tag.tag_id))
    }


    const selectedTagElements = newTags.map((tag, i) => <button className='tag bg-accent' key={i} onClick={() => deselectTags(tag)}>{tag.name}</button>)



    const regexPattern = tagInput
        .replace(/\s+/g, '\\s*')
        .split('')
        .join('\\s*');
    const filter = new RegExp(regexPattern, 'i');


    const tagOptions = allTags.filter(t => filter.test(t.name) && !newTags.map(t => t.tag_id).includes(t.tag_id)).slice(0,5).map((t,i) => <button className='fs-3 tag-option' key={i} onClick={() => selectTags(t)}>{t.name}</button>)



    useEffect(() => {
        if(!id) return
        const fetchQuestion = async () => {
            const question = await questionService.get(id)
            setQuestion(question)
            const allTags = await tagService.getAll()
            setAllTags(allTags)
            const questionTags = await tagService.getQuestionTags(id)
            setQuestionTags(questionTags)
            setNewTags(questionTags)
        }
        fetchQuestion()
    },[id])


    
    const edit = () => {
        const oldTagIds = questionTags.map(t => t.tag_id)
        const newTagIds = newTags.map(t => t.tag_id)
        const added = newTagIds.filter(t => !oldTagIds.includes(t))
        const removed = oldTagIds.filter(t => !newTagIds.includes(t) )
        tagService.editQuestionTags(question.question_id, added, removed)
        questionService.edit(question.question_id, question.title, question.body)
        navigate('/question/' + question.question_id)
    }
    
    return(
        <div className='card bg-white wide-75 flex-vert'>
            <table className='table gap-1'>
                <tbody>
                    <tr>
                        <td><label htmlFor="title">Title:</label></td>
                        <td className='wide-100'><input className='input wide-75' name='title' type="text" value={question.title} onChange={handleChange}></input></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td className='wide-100'><textarea className='textarea textarea--question wide-100' name='body' onChange={handleChange} value={question.body}></textarea></td>
                    </tr>
                    <tr className='tag-row'>
                        <td>Tags</td>
                        <td className='relative'>
                            <div className='tag-search wide-25 bg-white'>
                                <input value={tagInput} onChange={e => setTagInput(e.currentTarget.value)} className='input--tag' type="text" />
                                {tagInput.length > 0 && <div className='tag-options'>{tagOptions}</div>}
                            </div>
                            <button className='button add-tag bg-accent text-WHITE' onClick={addTag}>Add tag</button>
                        </td>
                    </tr>

                </tbody>
            </table>
            <div className='tags'>{selectedTagElements}</div>
            <div className="flex-vert align-start gap-1">
                <button className='button bg-light-grey text-black fs-3' onClick={() => navigate('/question/'+id)}>Cancel</button>
                <button className={`button fs-3 ${title && body && tagIds.length > 0? 'bg-accent text-WHITE' : 'bg-light-grey text-black'} align-end`} onClick={edit}>Post</button>
            </div>
        </div>      
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
        navigate('/question'+ id)
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

export function CreateComment({parent, parentId, show}: {parent: string, parentId: number, show: React.Dispatch<React.SetStateAction<any>>}) {

    const [comment, setComment] = useState('')

    const post = async () => {
        if(!comment || !parent || !parentId) return
        const answerId = await commentService.create(parent,parentId,comment)
        show(false)
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
export function EditComment({parent, commentId,show}: {parent: string, commentId: number, show: React.Dispatch<React.SetStateAction<false | number>>}) {

    const [comment, setComment] = useState('')

    const post = async () => {
        if(!comment || !parent) return
        await commentService.edit(commentId, parent,comment)
        show(false)
    }
    return(
        <div className='wide-100 row'>
        <textarea className='textarea textarea--comment wide-75' value={comment} onChange={e => setComment(e.currentTarget.value)}></textarea>
        <div className="flex-vert align-start">
            <button className='button bg-light-grey text-black fs-4' onClick={() => show(false)}>Cancel</button>
            <button className='button bg-accent text-WHITE fs-4' onClick={post}>Update comment</button>
        </div>
    </div>
    )
}

export function FilteredQuestions() {

    const params = useParams()
    
    const {filter, tag} = params
    const [questions, setQuestion] = useState<Question[]>([])
    
    useEffect(() => {
        if(!filter) return
        switch (filter){
            case 'tag':
                if(!tag) return
                questionService.getTagFilter(tag).then((questions: Question[]) => setQuestion(questions));
                break;
            case 'recent':
                questionService.getFilter(filter).then((questions: Question[]) => setQuestion(questions));
                break;
            case 'popular':
                questionService.getFilter(filter).then((questions: Question[]) => setQuestion(questions));
                break;
            case 'unanswered':
                questionService.getFilter(filter).then((questions: Question[]) => setQuestion(questions));
                break;
        }
        
    }, [filter]);

    const category = filter? `${filter[0].toUpperCase()}${filter.slice(1)} questions` : ''
    
    return(
        <div className='wide-75'>
            <QuestionList questions={questions} category={category} />
        </div>
    )
}

export function QuestionList({questions, category}: {questions: Question[], category: string}) {
    const questionElements = questions.map((question, i) => (
        <Link to={'/question/' + question.question_id} className='card row bg-white wide-75' key={i}>
            <p className="fs-2">{question.title}</p>
            <p className="fs-4">Answers: {question.answer_count}</p>
            <p className="fs-4">Views: {question.views}</p>
            <div className="tags">{<QuestionTags questionId={question.question_id}/>}</div>
        </Link>
    ))

    return(
        <div className='wide-100'>
            <p className="fs-1">{category}</p>
            {questionElements}
        </div>
    )
}

function QuestionTags({questionId}: {questionId: number}) {

    const [tags, setTags] = useState<Tag[]>([])
    useEffect(() => {
        if(!questionId) return
        const fetch = async() => {
            const tags = await tagService.getQuestionTags(questionId)
            setTags(tags)
        }
        fetch()
    }, []);

    const tagElements = tags.map((t,i) => <div key={i} className='tag fs-5'>{t.name}</div>)
    return(
        <div className='tags'>
            {tagElements}
        </div>
    )
}

function formatDate(date_: Date) {
    const currentDate = new Date();
    const date = new Date(date_)
  
    const yearDiff = currentDate.getFullYear() - date.getFullYear();
    const monthDiff = currentDate.getMonth() - date.getMonth();
    const dayDiff = currentDate.getDate() - date.getDate();
    const hourDiff = currentDate.getHours() - date.getHours();
  
    if (yearDiff > 0) {
      return `${yearDiff} year${yearDiff > 1 ? 's' : ''} ago`;
    } else if (monthDiff > 0) {
      return `${monthDiff} month${monthDiff > 1 ? 's' : ''} ago`;
    } else if (dayDiff > 0) {
      return `${dayDiff} day${dayDiff > 1 ? 's' : ''} ago`;
    } else if (hourDiff > 0) {
      return `${hourDiff} hour${hourDiff > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }
