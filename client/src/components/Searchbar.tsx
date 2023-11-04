// import React from "react";

//  class SearchBar extends Component<{match: {params: {text : string}}}>{
//     searchTerm: string = '';
//     ids: number[] = [];
//     render() {
//         return <div>
//             <input type='text' onChange={(event)=>this.searchTerm = event.currentTarget.value} ></input>
//             <button onClick={() => {questionService.search(this.searchTerm).then((ids: number[]) => (this.ids = ids))}}>Søk</button>
//         </div>
//     }
// }

// export class SearchResults extends Component<{match: {params: {ids: number[]}}}>{
//     ids: number[] = this.props.match.params.ids;
//     questions: Question[] = [];

//     render() {
//         return <div>
//             <ul>
//                 {this.questions.map((question) => (
//                 <li>
//                     <NavLink to={'/q/' + question.id}>{question.text}</NavLink>
//                 </li>
//             ))}
//             </ul>
//         </div>
//     }