import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios'
import React, {useState, useEffect, Dispatch, SetStateAction} from 'react';
import {questionService} from '../service'
import { Question } from '../types';
import { QuestionList } from './Questions';

export function Searchbar() {
    const [searchQuery, setSearchQuery] = useState('');
    const [questions, setQuestions] = useState<Question[]>([])
    const navigate = useNavigate();
    
    useEffect(() => {
        
        setQuestions([])
        if(!searchQuery) return
        const cancelToken = axios.CancelToken.source()
        const fetch = async () => {
            try {
                const questions = await questionService.search(searchQuery, cancelToken);
                setQuestions(questions)
            } catch (error) {
                if(axios.isCancel(error)) return
                console.error(error);
            }
        }
        fetch()
        return () => cancelToken.cancel();
    }, [searchQuery])
    
    const handleSearchText = (e: React.ChangeEvent<HTMLInputElement>) =>{
	    setSearchQuery(e.target.value)
    }
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        
        if(e.key != 'Enter') return
        
	    navigate('/question/search/'+searchQuery+'/results');
        setSearchQuery('')
    }

    const suggestions = questions.slice(0,10).map((question, i) => <div className='wide-100 search-result' key={i} onClick={() => {setSearchQuery('');navigate('/question/'+question.question_id)}}>{question.title}</div>)

    return(
        <>
			{searchQuery.length > 0 && <div onClick={() => setSearchQuery('')} className='hide-onclick'></div>}
            <div className='wide-100 searchbar'>
                <div className="suggestion-search bg-white wide-100">
                    <input aria-label='search' className='search--input' type='text' value={searchQuery} onKeyDown={handleKeyPress} onChange={handleSearchText} />
                    {questions.length > 0 && searchQuery && <div className='search-results'>{suggestions}</div>}
                </div>
            </div>
        </>
    )
}


export function SearchList() {
    const params = useParams();
    const [questions, setQuestions] = useState<Question[]>([])
    const query = params.query;
    
    useEffect(() => {
        async function fetchQuestions() {
            if(!query) return
            console.log(query);
            
            const questions = await questionService.search(query)
            console.log(questions);
            
            setQuestions(questions)
        }
        fetchQuestions();
    }, [query]);

    
    return (
        <div className='wide-75'>
            <QuestionList questions={questions} category={`Search results for ${query}`} />
        </div>
    )
}