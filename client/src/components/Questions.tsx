import React, {useState, useEffect, useContext} from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {questionService, answerService, tagService, commentService, profileService, favoriteService} from '../service'
import { Question, Answer, Tag, QuestionComment, Profile, AnswerComment} from '../types'
import { useParams, Link } from 'react-router-dom';
import { ProfileContext, AuthContext } from '../context/Context';
import { Answers } from './Answers';
import Pfp from './Pfp';
import { Comments, CreateComment } from './Comments';




export function QuestionDetails() {
    const params = useParams()
    const location = useLocation()
    const id = parseInt(params.id as string)
    const noOutlet = !location.pathname.includes('answer')
    const navigate = useNavigate()

    const {profile} = useContext(ProfileContext)
    const [question, setQuestion] = useState<Question>({} as Question)
    const [questionTags, setQuestionTags] = useState<Tag[]>([])
    const [comments, setComments] = useState<QuestionComment[]>([])
    const [showCreateComment, setShowCreateComment] = useState(false)


    useEffect(() => {
        const fetchQuestion = async () => {
            if(isNaN(id)) return
            //fetch question
            const question = await questionService.get(id)
            setQuestion(question)
            //fetch tags of question
            const tags = await tagService.getQuestionTags(id)
            setQuestionTags(tags)
            //fetch comments of question
            const comments = await commentService.get('question',question.question_id)
            setComments(comments as QuestionComment[])
        }
        fetchQuestion()
    }, [id]);

    const deleteQuestion = async () => {
        await questionService.delete(question.question_id)
        navigate('/')
    }

    //add comment to ui
    const addComment = (comment: string, commentId: number) => {
        if(!comment) return
        setShowCreateComment(false)
        const questionComment = {body: comment, comment_id: commentId, user_id: profile.user_id, question_id: question.question_id} as QuestionComment
        setComments(prev => [...prev, questionComment])
    } 
    //change comment in ui
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

    //remove comment from ui
    const deleteComment = (commentId: number) => {
        if(!commentId) return
        setComments(prev => prev.filter((c) => c.comment_id != commentId)) 
    } 


    const tagsElements = questionTags.map((tag, i) => <div key={i} className='tag fs-5'>{tag.name}</div>)
    if(!question.question_id) return <div></div>

    console.log(profile.user_id);
    

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
                    {profile.user_id == question.user_id && <> <Link className='button bg-light-grey text-black fs-4' to={`/question/${question.question_id}/edit`}>Edit</Link>
                    <button className='button bg-light-grey text-black fs-4' onClick={deleteQuestion}>Delete</button></>}
                </div>
            </div>
            <p className='fs-4 text-body'>{question.body}</p>
        </div>
        {noOutlet && <div className='card bg-white wide-75'>
            <p className="fs-4">{comments.length == 0 && 0} Comments</p>
            <Comments comments={comments} editComment={editComment} removeComment={deleteComment} parent={'question'} />

        </div>}

        <div className="wide-75">
            {showCreateComment && <CreateComment parent={'question'} parentId={question.question_id} addComment={addComment} show={setShowCreateComment}/>}
        </div>

        <Outlet />

        {noOutlet && <Answers question={question} setShowCreateComment={setShowCreateComment} />}
    </div>
}



export function UsernamePfp ({userId, withPfp}: {userId: number, withPfp: boolean}){

    const [profile, setProfile] = useState<Profile>({} as Profile)
    const navigate = useNavigate()
    
    useEffect(() => {
        if(!userId) return
        const fetch =  async() => {
            const profile = await profileService.get(userId)
            setProfile(profile)
        }
        fetch()
    }, [userId]);
    
    return(
        <div className='row gap-1 pointer' onClick={() => navigate('/profile/'+ profile.username)}>
            {withPfp && <Pfp size='s' pfp={profile.profile_picture} level={profile.level} />}
            <p className='fs-4'>{profile.display_name}</p>
        </div>
    )
} 

export function CreateQuestion() {

    const {profile} = useContext(ProfileContext)
    const navigate = useNavigate()
    const {isAuthenticated} =  useContext(AuthContext)

    const [question, setQuestion] = useState<Question>({title: '', body: ''} as Question)
    const {title, body} = question
    const [questionTags, setQuestionTags] = useState<Tag[]>([])
    const tagIds = questionTags.map(t => t.tag_id)
    const [allTags, setAllTags] = useState<Tag[]>([])
    const [tagInput, setTagInput] = useState('')

    useEffect(() => {
        console.log(question);
        if(!isAuthenticated) navigate('/login')
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

    //add tag to list, if tag doesnt exist => create tag
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
            console.log(error);
        }
    }

    // regex to filter for name, space and case insensetive 
    const regexPattern = tagInput
        .replace(/\s+/g, '\\s*')
        .split('')
        .join('\\s*');
    const filter = new RegExp(regexPattern, 'i');

    // apply regex and map results to jsx elements 
    const tagOptions = allTags.filter(t => filter.test(t.name) && !questionTags.map(t => t.tag_id).includes(t.tag_id)).slice(0,5).map((t,i) => <button className='fs-3 tag-option' key={i} onClick={() => selectTags(t)}>{t.name}</button>)

    if(!isAuthenticated) return <div></div>
    
    return(
        <div className='card bg-white wide-75 flex-vert'>
            <table className='table gap-1'>
                <tbody>
                    <tr>
                        <td><label htmlFor="title">Title:</label></td>
                        <td className='wide-100'><input className='input wide-75' aria-label='title' name='title' type="text" value={question.title} onChange={handleChange}></input></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td className='wide-100'><textarea className='textarea textarea--question wide-100' name='body' onChange={handleChange} value={question.body} aria-label='body'></textarea></td>
                    </tr>
                    <tr className='tag-row'>
                        <td>Tags</td>
                        <td className='relative'>
                            <div className='tag-search wide-25 bg-white'>
                                <input value={tagInput} onChange={e => setTagInput(e.currentTarget.value)} aria-label='tag-input' className='input--tag' type="text" />
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

    const [question, setQuestion] = useState<Question>({title: '', body: ''} as Question)
    const {title, body} = question
    const [questionTags, setQuestionTags] = useState<Tag[]>([])
    const [newTags, setNewTags] = useState<Tag[]>([])
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
            selectTags(tag)
            fetchTags()
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
        if(!title || !body || newTags.length == 0) return
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
            <div className="flex-vert align-end gap-1">
                <button className='button bg-light-grey text-black fs-3' onClick={() => navigate('/question/'+id)}>Cancel</button>
                <button className={`button fs-3 ${title && body && newTags.length > 0? 'bg-accent text-WHITE' : 'bg-light-grey text-black'} align-end`} onClick={edit}>Post</button>
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

export function formatDate(date_: Date) {
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
