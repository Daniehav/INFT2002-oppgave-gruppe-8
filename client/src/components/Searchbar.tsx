import { useNavigate, useParams } from 'react-router-dom';
import React, {useState, useEffect, Dispatch, SetStateAction} from 'react';
import {questionService} from '../service'
import { Question } from '../types';

export function Searchbar() {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] : [Question[], Dispatch<SetStateAction<Question[]>>] = useState([{question_id: 0,user_id: 0,title: "",body: "",views: 0,created_at: new Date(),updated_at: new Date()}])
    const navigate = useNavigate();
    
    // 1 sek etter inntasting slutter kommer det inn søkeforslag
    //flytt over til Suggestions? trenger å forsikre seg om at ting rendres
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            const questions = await questionService.search(searchQuery);
            setSuggestions(questions)
        }, 1000)
    
        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery])
    
    function handleSearchText(e: any){
	    setSearchQuery(e.target.value)
    }
    function handleSubmit(){
	    navigate('/q/search/'+searchQuery+'/results');
    }
    // sliter med å passere spørsmål over til <Suggestions />-komponenten
    return(
        <div>
            <input type='text' onChange={handleSearchText} />
            <button onClick={handleSubmit}>search</button><br />
            <Suggestions {... suggestions} />
        </div>
    )
}

function Suggestions(questions: Question[]) {
    function handleClick(id: number) {
        const navigate = useNavigate();
        navigate('/q/'+id)
    }

    if(questions.length > 0){  
        return (
            <div>
                {questions.map((question) => {<><div onClick={() => handleClick(question.question_id)}>{question.title}</div><br /></>})}
            </div>
        )
    } else {
        return (
            <></>
        )
    }
}