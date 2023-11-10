import React, {useState, useEffect, useContext} from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {questionService, answerService, tagService, commentService, profileService} from '../service'
import { Question, Answer, Tag, Comment, Profile} from '../types'
import { useParams, Link } from 'react-router-dom';
import { ProfileContext } from '../context/Context';
import Pfp from './Pfp';
import sortDown from '../assets/sort-down.svg'
import sortUp from '../assets/sort-up.svg'
import downvote from '../assets/downvote.svg'
import upvote from '../assets/upvote.svg'
import accepted from '../assets/accepted.svg'
import accept from '../assets/accept.svg'


export function QuestionDetails() {
    const params = useParams()
    const location = useLocation()
    const id = parseInt(params.id as string)
    const noOutlet = !location.pathname.includes('answer')

    const {profile} =  useContext(ProfileContext)
    const [question, setQuestion] = useState<Question>({} as Question)
    const [questionTags, setQuestionTags] = useState<Tag[]>([])
    

    useEffect(() => {
        console.log(id);
        
        const fetchQuestion = async () => {
            if(isNaN(id)) return
            
            const question = await questionService.get(id)
            setQuestion(question)
            const tags = await tagService.getQuestionTags(id)
            setQuestionTags(tags)
        }
        fetchQuestion()
    }, [id]);


    const tagsElements = questionTags.map((tag, i) => <div key={i} className='tag fs-5'>{tag.name}</div>)

    return <div className='question-page'>
        <div className="wide-75 card bg-white">
            <div className='question-header'>
                <div className="row">
                    <UsernamePfp userId={question.user_id} withPfp={true} />
                </div>
                <p className='fs-1'>{question.title}</p>
                <div className='row'>
                    <p className='fs-5'>Asked {formatDateDifference(question.created_at)}</p>
                    <p className='fs-5'>Modified {formatDateDifference(question.updated_at)}</p>
                    <p className='fs-5'>Viewed {question.views} {question.views == 1? 'time' : 'times'}</p>
                    <div className='tags'>{tagsElements}</div>
                </div>
            </div>
            <p className='fs-4 text-body'>{question.body}</p>
        </div>

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

    useEffect(() => {
        if(!question.question_id) return
        const fetch = async() => {
            const answers = await answerService.getAll(question.question_id)
            console.log(answers);
            
            setAnswers(answers)
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
        const accepted = await questionService.accept(question.question_id, answer.answer_id)
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

    const answersElements = answers.map((answer, i) => {
        const postedQuestion = question.user_id == profile.user_id
        const postedAnswer = answer.user_id == profile.user_id
        let acceptIconClass = answer.accepted? 'accepted' : postedQuestion? 'accept' : 'vis-hide'
        console.log(acceptIconClass, postedQuestion);

        return (
            <div key={i} className='card bg-white wide-100'>
                <img onClick={() => acceptAnswer(answer)} className={`icon-m ${acceptIconClass} pointer`} src={accepted} alt=""/>
                <div className='row'>
                    <UsernamePfp userId={answer.user_id} withPfp={true} />
                </div>
                <div className="row">
                    <div className='flex-vert align-center gap-05'>
                        <img onClick={() => vote(answer, 'upvote')} className='icon-s pointer' src={upvote} alt="" />
                        <p className='fs-3 vote-count'>{answer.upvotes - answer.downvotes}</p>
                        <img onClick={() => vote(answer, 'downvote')} className='icon-s pointer' src={downvote} alt="" />
                    </div>
                    <p className='text-body'>{answer.body}</p>
                </div>
                <div>
                    <Comments parent={answer} />
                </div>
                {postedAnswer && 
                <div>
                    <NavLink to={'/a/' + answer.answer_id + '/edit'}>Edit</NavLink>
                    <button onClick={() => {answerService.delete(answer.answer_id)}}>Delete</button>
                </div>}
            </div>
        )
    })

    
    return(
        <>
            {answers.length > 0? 
                <div className='wide-75'>
                    <div className='row'>
                    <p>{answers.length} answers</p>
                    <button className='text-black' onClick={() => setSortBy('latest')}>Sort by latest</button>
                    <img className='icon-s pointer' onClick={() => setDescending(prev => !prev)} src={descending? sortDown : sortUp} alt="" />
                    <button className='text-black' onClick={() => setSortBy('score')}>Sort by score</button>
                </div>
                {answersElements}
            </div> : 
            <div className='wide-75 card bg-white fs-3 row'>
                <p>No answers yet</p>
                {profile.user_id != question.user_id && <>
                    <Link to={`/question/${question.question_id}/answer/create`} className="button bg-light-grey text-black">Post answer</Link>
                    <Link to={`/question/${question.question_id}/comment/create`} className="button bg-light-grey text-black">Post comment</Link>
                </>}
            </div>}
        </>
    )
} 

function Comments({parent}: {parent: Question | Answer}){
    const [comments, setComments] = useState<Comment[]>([])
    useEffect(() => {
        const fetch = async () => {
            if(parent.question_id){
                const question = parent as Question
                const comments = await commentService.getQuestions(question.question_id)
                setComments(comments)
            } else{
                const answer = parent as Answer
                const comments = await commentService.getAnswer(answer.answer_id)
                setComments(comments)
            }
        }
        fetch()
    }, []);

    const commentElements = comments.map((c,i) => {
        return (
            <div className='row'>
                <p className='text-body'>{c.body}</p> 
                <UsernamePfp userId={c.user_id} withPfp={false} />
                <p>{c.updated_at}</p>
            </div>
        )
    })
    
    return(
        <div>
            {commentElements}
        </div>
    )
}

function UsernamePfp ({userId, withPfp}: {userId: number, withPfp: boolean}){

    const [profile, setProfile] = useState<Profile>({} as Profile)
    
    useEffect(() => {
        if(!userId) return
        const fetch =  async() => {
            console.log(userId);
            const profile = await profileService.get(userId)
            console.log(profile);
            
            setProfile(profile)
            console.log(profile);
            
        }
        fetch()
    }, [userId]);
    
    return(
        <>
            {withPfp && <Pfp size='s' pfp={profile.profile_picture} level={profile.level} />}
            <p className='fs-3'>{profile.display_name}</p>
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
        console.log(name, value);
        
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

    console.log(questionTags);
    

    const selectedTagElements = questionTags.map((tag, i) => <button className='tag bg-accent' key={i} onClick={() => deselectTags(tag)}>{tag.name}</button>)


    const create = async () => {
        if(!profile.user_id || title || body || tagIds)
        try {
            const questionId = await questionService.create(profile.user_id, title, body, tagIds)
            console.log(questionId);
            
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
    const [question, setQuestion] = useState<Question>({} as Question)
    const [questionTags, setQuestionTags] = useState<Tag[]>([])
    const [allTags, setAllTags] = useState<Tag[]>([])
    const [unselectedTags, setUnselectedTags] = useState<Tag[]>([])

    useEffect(() => {
        if(!id) return
        const fetchQuestion = async () => {
            const question = await questionService.get(id)
            setQuestion(question)
            const questionTags = await tagService.getAll()
            setQuestionTags(questionTags)
            const allTags = await tagService.getQuestionTags(id)
            setAllTags(allTags)
            //@ts-ignore
            const unselected = allTags.filter(tag => !questionTags.map(t => t.tag_id).includes(tag.tag_id))
            setUnselectedTags(unselected)
        }
        fetchQuestion()
    },[id])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.currentTarget
        setQuestion(prev => {
            return {
                ...prev,
                [name]: value
            }
        })
    }

    
    const selectTags = (tag: Tag, i: number) => {
        setQuestionTags(prev => {
            return {
                ...prev,
                tags: [...prev, tag]
            }
        })
        setUnselectedTags(prev => prev.splice(i, 1))
    }

    const deselectTags = (tag: Tag, i: number) => {
        setQuestionTags(prev => prev.splice(i, 1))
        setUnselectedTags(prev => [...prev, tag])
    }
    
    const selectedTagElements = questionTags.map((tag, i) => {
        <button className='tag bg-accent' key={i} onClick={() => deselectTags(tag, i)}>{tag.name}</button>
    })

    const unselectedTagElements = unselectedTags.map((tag, i) => {return (
        <button className='tag' key={i} onClick={() => selectTags(tag,i)}>{tag.name}</button>
    )})

    
    const edit = () => {
        questionService.edit(question);
        const tagIds = questionTags.map(t => t.tag_id)
        // tagService.editQuestionTags(question.question_id, tagIds)
    }
    
    return(
        <div>
            <label htmlFor="title">Title:</label>
            <input name='title' type="text" value={question.body} onChange={handleChange}></input>
            <textarea></textarea>
            <div>
                <p>Tags</p>
                <div>{selectedTagElements}{unselectedTagElements}</div>
            </div>
            <button onClick={edit}>Update</button>
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
    const id = parseInt(params.id as string)
    const [answer, setAnswer] = useState<Answer>({} as Answer)

    useEffect(() => {
        if(!id) return
        answerService.get(id).then((answer: Answer) => setAnswer(answer));
    }, []);

    const edit = () => {
        answerService.edit(answer);
    }

    return(
        <>
            <div></div>
            <input type="text" value={answer.body} onChange={(e) => setAnswer(prev => {return{...prev, text: e.currentTarget.value}})}></input>
            <button onClick={edit}>Update</button>
        </>  
    )
}

export function CreateComment() {

    const [comment, setComment] = useState('')
    const navigate = useNavigate()
    const params = useParams()

    const post = async () => {
        if(!comment) return
        const answerId = await commentService.create(comment)
        navigate('/question/'+ params.questionId)
    }
    return(
        <div className='card wide-75 bg-white row'>
            <textarea className='textarea textarea--answer wide-75' value={comment} onChange={e => setComment(e.currentTarget.value)}></textarea>
            <button className='button bg-accent text-WHITE fs-3' onClick={post}>Post comment</button>
        </div>
    )
}
export function EditComment() {

    const [comment, setComment] = useState('')
    const navigate = useNavigate()
    const params = useParams()

    const post = async () => {
        if(!comment) return
        const answerId = await commentService.create(comment)
        navigate('/question/'+ params.questionId)
    }
    return(
        <div className='card wide-75 bg-white row'>
            <textarea className='textarea textarea--answer wide-75' value={comment} onChange={e => setComment(e.currentTarget.value)}></textarea>
            <button className='button bg-accent text-WHITE fs-3' onClick={post}>Post comment</button>
        </div>
    )
}

export function FilteredQuestions() {

    const params = useParams()
    
    const {filter, tag} = params
    const [questions, setQuestion] = useState<Question[]>([])
    const [questionTags, setQuestionTags] = useState<Question[]>([])
    
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
        console.log(questions);


        
    }, [filter]);

    const questionElements = questions.map((question, i) => (
        <Link to={'/question/' + question.question_id} className='card row bg-white wide-75' key={i}>
            <p className="fs-2">{question.title}</p>
            <p className="fs-4">Views: {question.views}</p>
            <div className="tags">{<QuestionTags questionId={question.question_id}/>}</div>
        </Link>
    ))
    
    return(
        <div className='wide-75'>
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

function formatDateDifference(date_: Date) {
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
