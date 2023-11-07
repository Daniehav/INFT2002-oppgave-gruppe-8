import { useNavigate, useParams } from 'react-router-dom';
import React, {useEffect} from 'react';
import {questionService} from '../service'
import { Question } from '../types';

function CompactQuestion(question: Question) {
    const navigate = useNavigate();

    return (
        <div onClick={() => navigate('/q/'+question.question_id)}>
            <div>{question.title}</div>
            <div>{question.body}</div>
        </div>
    )
}

export function SearchList() {
    
    const params = useParams();

    const query: string = params.query!;

    const questions = questionService.search(query)
    return (
        <div>
            <ul>
                {(questions).map((question: Question) => <li>{CompactQuestion(question)}</li>)}
            </ul>
        </div>
    )
    
}