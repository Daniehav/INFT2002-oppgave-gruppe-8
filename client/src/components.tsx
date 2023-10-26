import * as React from 'react';
import { Component } from 'react-simplified';
import { NavLink } from 'react-router-dom';
import {Question, Answer, questionService, answerService} from './service'
import { createHashHistory } from 'history';

//det er for øyeblikket mulig å like et svar flere ganger, tror dette må fikses når vi integrerer brukere
export class QuestionDetails extends Component<{ match: { params: { id: number } } }> {
    question: Question = { id: 0, text: '', answered: false, date: new Date(0), tags: []};
    answers: Answer[] = [];

    render() {
        return <div>
            <div id="question">
                <h4>{this.question.text}</h4><h6>answered: {this.question.answered}</h6>
                <div id="tags">{this.question.tags.map((tag) => <div>{tag}</div>)}</div>
                <NavLink to={'/q/' + this.question.id + '/edit'}>endre</NavLink>
                <button onClick={() => {questionService.delete(this.question.id)}}>slett</button>
            </div>
            <button onClick={() => {
                this.answers.sort((a: Answer, b: Answer) => {return a.score - b.score});
                document.getElementById("answers")!.innerHTML = "{this.answers.map((answer) => (<div><div>{answer.text} score:{answer.score}<button onClick ={() => answer.score++}>Lik</button> sist redigert:{answer.lastEdit}</div><NavLink to={'/a/' + answer.id + '/edit'}>endre</NavLink><button onClick={() => {answerService.delete(answer.id)}}>slett</button></div>))}"
                }}>sorter etter score</button>
            <div id="answers">
            {this.answers.map((answer) => (
                <div>
                <div>
                {answer.text} score:{answer.score}<button onClick ={() => answer.score++}>Lik</button> sist redigert:{answer.lastEdit}</div>
                <NavLink to={'/a/' + answer.id + '/edit'}>endre</NavLink>
                <button onClick={() => {answerService.delete(answer.id)}}>slett</button>
                </div>
            ))}
            </div>
        </div>
    }
    mounted() {
        questionService.get(this.props.match.params.id).then((question: Question) => (this.question = question));
        questionService.getTags(this.props.match.params.id).then((tags: string[]) => (this.question.tags = tags));
        answerService.getAll(this.question.id).then((answers: Answer[]) => (this.answers = answers));
    }
}

export class SearchBar extends Component<{match: {params: {text : string}}}>{
    searchTerm: string = '';
    ids: number[] = [];
    render() {
        return <div>
            <input type='text' onChange={(event)=>this.searchTerm = event.currentTarget.value} ></input>
            <button onClick={() => {questionService.search(this.searchTerm).then((ids: number[]) => (this.ids = ids))}}>Søk</button>
        </div>
    }
}

export class SearchResults extends Component<{match: {params: {ids: number[]}}}>{
    ids: number[] = this.props.match.params.ids;
    questions: Question[] = [];

    render() {
        return <div>
            <ul>
                {this.questions.map((question) => (
                <li>
                    <NavLink to={'/q/' + question.id}>{question.text}</NavLink>
                </li>
            ))}
            </ul>
        </div>
    }

    mounted() {
        for(let i = 0; i < this.ids.length; i++){
            questionService.get(this.ids[i]).then((question: Question) => (this.questions.push(question)));
        }
    }
}
//Denne er ment å fungere som det generelle filteret for spørsmål, filtrering etter tag trenger kanskje egen om det skal gå ann å søke med flere
export class FilteredQuestions extends Component<{match: {params: {filter: string}}}> {
    filter: string = this.props.match.params.filter;
    questions: Question[] = [];
    render() {
        return <div>
            <ul>
                {this.questions.map((question) => (
                <li>
                    <NavLink to={'/q/' + question.id}>{question.text}</NavLink>
                </li>
            ))}
            </ul>
        </div>
    }
    mounted() {
        switch (this.filter){
            case 'recent':
                questionService.recent().then((questions: Question[]) => this.questions = questions);
                break;
            case 'popular':
                questionService.popular().then((questions: Question[]) => this.questions = questions);
                break;
            case 'unanswered':
                questionService.unanswered().then((questions: Question[]) => this.questions = questions);
                break;
        }
    }
}

export class EditQuestion extends Component<{match: {params: {id: number}}}> {
    id: number = this.props.match.params.id;
    question: Question = { id: 0, text: '', answered: false, date: new Date(0), tags: []};
    tags: string[] = [];

    render() {
        <>
            <div>Spørsmål</div>
            <input type="text" value={this.question.text} onChange={(event) => {this.question.text = event.currentTarget.value}}></input><br></br>
            <div>Tags</div>
            <ul>{this.tags.map((tag) => {
                if(this.question.tags.indexOf(tag) === -1){
                    <li><input type="checkbox" id={tag} onChange={(event) => {
                        if(event.currentTarget.value){
                            this.question.tags.push(tag);
                        } else {
                            this.question.tags.splice(this.question.tags.indexOf(tag), 1);
                        }
                    }}>{tag}</input></li>}
                else {
                    <li><input type="checkbox" checked id={tag} onChange={(event) => {
                        if(event.currentTarget.value){
                            this.question.tags.push(tag);
                        } else {
                            this.question.tags.splice(this.question.tags.indexOf(tag), 1);
                        }
                    }}>{tag}</input></li>
                }
            })}</ul>
            <button onClick={() => {
                this.question.date = new Date();
                questionService.edit(this.question);
            }}>Lagre</button>
        </>        
    }
    mounted() {
        questionService.get(this.props.match.params.id).then((question: Question) => (this.question = question));
        questionService.getTags(this.props.match.params.id).then((tags: string[]) => (this.question.tags = tags));
    }
}
export class EditAnswer extends Component<{match: {params: {id: number}}}> {
    id: number = this.props.match.params.id;
    answer: Answer = { id: 0, text: '', score: 0, accepted: false, lastEdit: new Date(0), qId: 0 };

    render() {
        <>
            <div>Svartekst</div>
            <input type="text" value={this.answer.text} onChange={(event) => {this.answer.text = event.currentTarget.value}}></input><br></br>
            <button onClick={() => {
                this.answer.lastEdit = new Date();
                answerService.edit(this.answer);
                }}>Lagre</button>
        </>  
    }
    mounted() {
        answerService.get(this.props.match.params.id).then((answer: Answer) => (this.answer = answer));
    }
}
