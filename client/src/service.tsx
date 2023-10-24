import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:3000/api/v1';

export type Question = {
  id: number;
  text: string;
  answered: boolean;
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

  search(text: string) {
    return axios.get<Question>('/q/'+text).then((response) => response.data)
  }

  create(title: string) {
    return axios
      .post<{ id: number }>('/q', { title: title })
      .then((response) => response.data.id);
  }
}

class AnswerService {
    getAll(qId: number) {
        return axios.get<Answer[]>('/q/' + qId).then((response) => response.data);
    }
}

export const questionService = new QuestionService();
export const answerService = new AnswerService();