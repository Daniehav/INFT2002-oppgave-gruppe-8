import React, {useState, useEffect, useContext} from 'react';
import { NavLink } from 'react-router-dom';
import {questionService, answerService, tagService} from '../service'
import { Question, Answer, Tag} from '../types'
import { useParams } from 'react-router-dom';
import { ProfileContext } from '../context/Context';
import sortDown from '../assets/sort-down.svg'
import sortUp from '../assets/sort-up.svg'
import downvote from '../assets/downvote.svg'
import upvote from '../assets/upvote.svg'
import accepted from '../assets/accepted.svg'
import accept from '../assets/accept.svg'

//det er for øyeblikket mulig å like et svar flere ganger, tror dette må fikses når vi integrerer brukere

export function QuestionDetails() {
    const params = useParams()
    const id = parseInt(params.id as string)

    const {profile} =  useContext(ProfileContext)
    const [question, setQuestion] = useState<Question>({} as Question)
    const [questionTags, setQuestionTags] = useState<Tag[]>([])
    const [answers, setAnswers] = useState<Answer[]>([])
    const [descending, setDescending] = useState(true)
    const [sortBy, setSortBy] = useState<'score' | 'latest'>('score')

    useEffect(() => {
        if(!id) return
        const fetchQuestion = async () => {
            const question = await questionService.get(id)
            setQuestion(question)
            const tags = await tagService.getQuestion(id)
            setQuestionTags(tags)
            const answers = await answerService.getAll(question.question_id)
            setAnswers(answers)
        }
        fetchQuestion()
    }, [id]);


    const answersElements = answers.map((answer) => {
        const postedQuestion = question.user_id == profile.id
        const postedAnswer = answer.user_id == profile.id
        return (
            <div>
                {postedQuestion && <img src={accept} alt=""/>}
                {answer.accepted && <img src={accepted} alt="" />}
                <div>
                    <img src={upvote} alt="" />
                    <p className='fs-3'>{answer.upvotes - answer.downvotes}</p>
                    <img src={downvote} alt="" />
                </div>
                <div>
                </div>
                {postedAnswer && 
                <div>
                    <NavLink to={'/a/' + answer.answer_id + '/edit'}>Edit</NavLink>
                    <button onClick={() => {answerService.delete(answer.answer_id)}}>Delete</button>
                </div>}
            </div>
        )
    })

    const tagsElements = questionTags.map((tag) => <div className='tag'>{tag}</div>)

    useEffect(() => {
        setAnswers(prev => {
            return prev.sort((a, b) => {
                const scoreA = a.upvotes - a.downvotes
                const scoreB = b.upvotes - b.downvotes
                if(sortBy == 'score') return descending? scoreB - scoreA : scoreA - scoreB
                if(sortBy == 'latest') return descending? b.updated_at.getTime() - a.updated_at.getTime() : a.updated_at.getTime() - b.updated_at.getTime()
                return 0
            });
        })
    }, [sortBy, descending]);



    return <div>
        <div className="question">
            <h2>{question.title}</h2>
            <h4>{question.body}</h4>
            <div>{tagsElements}</div>
        </div>
        <button onClick={() => setSortBy('latest')}>Sort by latest</button>
        <img className='icon-s pointer' onClick={() => setDescending(prev => !prev)} src={descending? sortDown : sortUp} alt="" />
        <button onClick={() => setSortBy('score')}>Sort by score</button>
        {answersElements}
    </div>
}


//Denne er ment å fungere som det generelle filteret for spørsmål, filtrering etter tag trenger kanskje egen om det skal gå ann å søke med flere
export function FilteredQuestions() {

    const params = useParams()
    
    const {filter, tagId} = params
    const [questions, setQuestion] = useState<Question[]>([])
    
    useEffect(() => {
        if(!filter) return
        const tag = parseInt(tagId as string)
        switch (filter){
            case 'tag':
                questionService.getFilter(filter, tag).then((questions: Question[]) => setQuestion(questions));
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

    return <div>
        <ul>
            {questions.map((question) => (
            <li>
                <NavLink to={'/q/' + question.question_id}>{question.body}</NavLink>
            </li>
        ))}
        </ul>
    </div>
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
            const allTags = await tagService.getQuestion(id)
            setAllTags(allTags)
            const unselected = allTags.filter(tag => !questionTags.map(t => id).includes(tag.tag_id))
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
        <button className='tag bg-accent' key={i} onClick={() => deselectTags(tag, i)}>{tag.tag}</button>
    })

    const unselectedTagElements = unselectedTags.map((tag, i) => {return (
        <button className='tag' key={i} onClick={() => selectTags(tag,i)}>{tag.tag}</button>
    )})

    
    const edit = () => {
        questionService.edit(question);
        const tagIds = questionTags.map(t => t.tag_id)
        tagService.postQuestion(question.question_id, tagIds)
    }
    
    return(
        <>
            <div>Question</div>
            <input type="text" value={question.body} onChange={handleChange}></input>
            <div>
                <p>Tags</p>
                <div>{selectedTagElements}{unselectedTagElements}</div>
            </div>
            <div></div>
            <button onClick={edit}>Update</button>
        </>        
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