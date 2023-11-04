import React, {useState} from "react";
import { questionService } from "../service";
import { Question } from "../types"
import { useNavigate } from "react-router-dom";

// DisplayQuestion gir en veldig grunnleggende visning av spørsmål, bare ment som forhåndsvisning
function DisplayQuestion(question: Question) {
    const navigate = useNavigate();
    
    return (
        <div onClick={() => navigate('/question/'+question.id)}>
            <div>{question.title}</div>
            <div>{question.body}</div>
        </div>
    )
}

function QuestionList(query: string) {
    const questions: Question[] = questionService.search(query)
    return (
        <div>
            <ul>
                {questions.map((question) => <li>{DisplayQuestion(question)}</li>)}
            </ul>
        </div>
    )
}

export default QuestionList