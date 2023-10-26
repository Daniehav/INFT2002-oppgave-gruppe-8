import * as React from 'react';
import { Component } from 'react-simplified';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route,NavLink } from 'react-router-dom';
import { QuestionDetails, FilteredQuestions, EditAnswer, EditQuestion } from './components';
import { Question, questionService } from './service'


//bruk av <div> og <h> er ment å være middlertidig
class Home extends Component {
  recent: Question[] = [];
  popular: Question[] = [];
  unanswered: Question[] = [];
  tags: string[] = []
  render() {
    return <div id="home">
    <h1>*sidenavn*</h1>
    <div id="panels">
      <div id="recentQuestions">
        <h6>Nylige spørsmål</h6>
        {this.recent.map((question) => (
          <div>
            <NavLink to={'/q/' + question.id}>{question.text}</NavLink>
            {question.tags.map((tag) => (<div>{tag}</div>))}
          </div>
        ))}
        <NavLink to={'/q/filter/recent'}>Se alle de nyeste spørsmålene</NavLink>
      </div>
      <div id="popularQuestions">
        <h6>Populære spørsmål</h6>
        {this.popular.map((question) => (
          <div>
            <NavLink to={'/q/' + question.id}>{question.text}</NavLink>
            {question.tags.map((tag) => (<div>{tag}</div>))}
          </div>
        ))}
        <NavLink to={'/q/filter/popular'}>Se alle de mest populære spørsmålene</NavLink>
      </div>
      <div id="unansweredQuestions">
        <h6>Ubesvarte spørsmål</h6>
        {this.unanswered.map((question) => (
          <div>
            <NavLink to={'/q/' + question.id}>{question.text}</NavLink>
            {question.tags.map((tag) => (<div>{tag}</div>))}
          </div>
        ))}
        <NavLink to={'/q/filter/unanswered'}>Se alle ubesvarte spørsmål</NavLink>
      </div>
      <div>
        <div id="search"><input type="text"></input></div><br></br>
        <div><input type="text"></input><br></br>
        <ul>{this.tags.map((tag) => <li><input type="checkbox" id={tag}>{tag}</input></li>)}</ul>
        <br></br><button>lag spørsmål</button></div>
      </div>
    </div>
  </div>
  }

  mounted() {
    questionService.recentPreview().then((questions: Question[]) => this.recent = questions);
    questionService.popularPreview().then((questions: Question[]) => this.popular = questions);
    questionService.unansweredPreview().then((questions: Question[]) => this.unanswered = questions);
    questionService.getAllTags().then((tags: string[]) => this.tags = tags);
  }
}


let root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <HashRouter>
      <div>
        <Route exact path="/" component={Home} />
        <Route exact path="/q/:id(\d+)" component={QuestionDetails} />
        <Route exact path="/q/filter/:filter" component={FilteredQuestions} />
        <Route exact path="/a/:id(\d+)/edit" component={EditAnswer} />
        <Route exact path="/q/:id(\d+)/edit" component={EditQuestion} />
      </div>
    </HashRouter>,
  );
