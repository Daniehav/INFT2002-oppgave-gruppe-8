import * as React from 'react';
import { Component } from 'react-simplified';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route } from 'react-router-dom';
import { QuestionDetails } from './components';



class Home extends Component {
  render() {
    return <div id="home">
    <h1>*name of site*</h1>
    <div id="panels">
      <div id="recentQuestions">
        <h6>Recent questions</h6>
        <div>what way is up?</div>
        <div>how do I find the angle of a circle?</div>
      </div>
      <div id="popularQuestions">
        <h6>Popular questions</h6>
        <div>what way is up?</div>
        <div>how do I find the angle of a circle?</div>
      </div>
      <div id="unansweredQuestions">
        <h6>Unanswered questions</h6>
        <div>what way is up?</div>
        <div>how do I find the angle of a circle?</div>
      </div>
      <div>
        <div id="search"><input type="text"></input><br></br><p>add tags?</p></div><br></br>
        <div id="writeQuestion"><input type="text"></input><button>make question</button></div>
      </div>
    </div>
  </div>
  }
}


let root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <HashRouter>
      <div>
        <Route exact path="/" component={Home} />
        <Route exact path="/q/:id" component={QuestionDetails} />
      </div>
    </HashRouter>,
  );
