import * as React from 'react';
import { Component } from 'react-simplified';
import {Question, Answer, questionService, answerService} from './service'
import { createHashHistory } from 'history';

export class QuestionDetails extends Component<{ match: { params: { id: number } } }> {
    question: Question = { id: 0, text: '', answered: false, tags: []};

    render() {
        return <div>
            <h4>{this.question.text}</h4><h6>answered: {this.question.answered}</h6>
            <div id="tags"><div>tag1</div><div>tag2</div></div>
        </div>
    }
    mounted() {
        questionService.get(this.props.match.params.id).then((question: Question) => (this.question = question))
        questionService.getTags(this.props.match.params.id).then((tags: string[]) => (this.question.tags = tags))
    }
}
/*
export class SearchBar extends Component<{match: {params: {text : string}}}>{
    searchTerm: string = '';

    render() {
        return <div>
            <input type='text' onChange={(event)=>this.searchTerm = event.currentTarget.value} ></input>
            <button onClick={() => history.push('/q/')}>Search</button>
        </div>
    }
}
*/
