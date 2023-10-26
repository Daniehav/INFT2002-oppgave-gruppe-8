import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:3000/api/v1';
//Date virker som en upraktisk datatype, vurder å endre
//trenger man Question.answered eller kan dette infereres i tilfeller hvor det finnes et svar med Answer.accepted = True?
export type Question = {
  id: number;
  text: string;
  answered: boolean;
  date: Date;
  tags: string[];
};

export type Answer = {
    id: number;
    text: string;
    score: number;
    accepted: boolean;
    lastEdit: Date;
    qId: number;
}

class QuestionService {
  get(id: number) {
    return axios.get<Question>('/q/' + id).then((response) => response.data);
  }

  getTags(id:number) {
    return axios.get<string[]>('/q/'+id+'/tags').then((response) => response.data);
  }
// burde returnere alle id-ene til spørsmål som passer til søk
  search(text: string) {
    return axios.get<number[]>('/q/search/query='+text).then((response) => response.data);
  }

  create(text: string, tag: string[]) {
    return axios
      .post<{ id: number }>('/q', { text: text, tag: tag })
      .then((response) => response.data.id);
  }
  getAllTags() {
    return axios.get<string[]>('/tags').then((response) => response.data);
  }

  //Jeg ser for meg at disse tre gir de 4-5 nyeste/høyest rangerte spørsmålene
  recentPreview() {
    return axios.get<Question[]>('/q/recent/preview').then((response) => response.data);
  }
  popularPreview() {
    return axios.get<Question[]>('/q/popular/preview').then((response) => response.data);
  }
  unansweredPreview() {
    return axios.get<Question[]>('/q/unanswered/preview').then((response) => response.data);
  }
  //disse tre kan nok kombineres til én getFilter(type: string) eller noe, hvor de splittes på serversiden like før spørring sendes til db
  recent() {
    return axios.get<Question[]>('/q/recent').then((response) => response.data);
  }
  popular() {
    return axios.get<Question[]>('/q/popular').then((response) => response.data);
  }
  unanswered() {
    return axios.get<Question[]>('/q/unanswered').then((response) => response.data);
  }

  edit(question: Question) {
    return axios.put('/a', {question: question}).then((response) => response.data.id);
  }
  delete(id: number) {
    return axios.delete('/q/' + id).then((response) => response.data.id);
  }
}

class AnswerService {
  get(id: number) {
    return axios.get<Answer>('/a/'+id).then((response) => response.data);
  }
  getAll(qId: number) {
    return axios.get<Answer[]>('/q/' + qId).then((response) => response.data);
  }
  edit(answer: Answer) {
    return axios.put('/a', {answer: answer}).then((response) => response.data.id);
  }
  delete(id: number) {
    return axios.delete('/a/' + id).then((response) => response.data.id);
  }
}

export const questionService = new QuestionService();
export const answerService = new AnswerService();