import axios from "axios";
import { Profile, Question, Answer, Comment, Tag } from "./types";

axios.defaults.baseURL = 'http://localhost:3000/api/v1';

class AuthService {
    signIn(username: string, password: string){
        return axios.post<string>('/auth/signin', {username, password }).then(res => parseInt(res.data))
    }
    signUp(username: string, email: string, password: string){
        return axios.post<string>('/auth/signup', {username, email, password }).then(res => parseInt(res.data))
    }
    logOut() {
        return axios.post<void>('/auth/logout')
    }
    checkAuth() {
        return axios.get('/auth/authenticated').then(res => res.data)
    }
}

class ProfileService {  
    get(userId: number) {
        return axios.get<Profile>('/profile/' + userId).then(res => res.data)
    }

    update(userId: number, bio: string, pfp: string | null) {

        return axios.post<void>('/profile/'+ userId, {bio, pfp})
    }
}


class QuestionService {
  get(id: number) {
    return axios.get<Question>('/q/' + id).then((response) => response.data);
  }

  
  search(text: string) {
    return axios.get<Question[]>('/questions/search/'+text).then((response) => response.data);
  }

  create(text: string, tag: string[]) {
    return axios
      .post<{ id: number }>('/q', { text: text, tag: tag })
      .then((response) => response.data.id);
  }
  

  recentPreview() {
    return axios.get<Question[]>('/q/recent/preview').then((response) => response.data);
  }
  popularPreview() {
    return axios.get<Question[]>('/q/popular/preview').then((response) => response.data);
  }
  unansweredPreview() {
    return axios.get<Question[]>('/q/unanswered/preview').then((response) => response.data);
  }
  getFilter(filter: string, tagId?: number) {
      return axios.get<Question[]>('/q/filter', {params: {filter, tagId}}).then((response) => response.data);

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
  edit(Answer: Answer) {
    return axios.put('/a', {Answer: Answer}).then((response) => response.data.id);
  }
  delete(id: number) {
    return axios.delete('/a/' + id).then((response) => response.data.id);
  }
}

class CommentService {
  getAll(qId: number) {
    return axios.get<Comment[]>('/q/' + qId).then((response) => response.data);
  }
  edit(body: string) {
    return axios.put('/c', {body}).then((response) => response.data.id);
  }
  delete(id: number) {
    return axios.delete('/c/' + id).then((response) => response.data.id);
  }
}

class TagService {
    getAll() {
        return axios.get<Tag[]>('/tags').then((response) => response.data);
    }
    getQuestion(id:number) {
        return axios.get<Tag[]>('/tags/question/'+id).then((response) => response.data);
    }
    post(tag: string) {
        return axios.post('/tags',{tag}).then(response => response.data)
    }
    postQuestion(questionId: number, tags: number[]) {
        return axios.post('/tags/questions/' + questionId, {tags})
    }
}

export const questionService = new QuestionService();
export const answerService = new AnswerService();
export const authService = new AuthService()
export const profileService = new ProfileService()
export const tagService = new TagService()