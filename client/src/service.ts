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
        return axios.get<number>('/auth/authenticated').then(res => res.data)
    }
}

class ProfileService {  
    get(userId: number) {
        return axios.get<Profile>('/profile/' + userId).then(res => res.data)
    }

    update(userId: number, bio: string, pfp: string | null, displayName: string) {
        return axios.put<boolean>('/profile/'+ userId, {bio, pfp, displayName})
    }
}

class QuestionService {
  get(id: number) {
    console.log(id);
    
    return axios.get<Question>('/questions/' + id).then((response) => response.data);
  }

  getQuestionsUser(userId: number) {
    return axios.get<Question[]>('/questions/profile/'+ userId).then(response => response.data)
  } 

  
// burde returnere alle id-ene til spørsmål som passer til søk
  search(text: string) {
    return axios.get<number[]>('/questions/search/query='+text).then((response) => response.data);
  }

  create(userId: number, title: string, body: string, tags: number[]) {
    return axios.post<string>('/questions', {userId, title, body, tags}).then((response) => response.data);
  }
  
  getPreview(category: 'popular' | 'recent' | 'unanswered') {
    return axios.get<Question[]>('/questions/preview/'+ category).then((response) => response.data);
  }
  getFilter(filter: string) {
      return axios.get<Question[]>('/questions/filter/'+filter).then((response) => response.data);
  }
  getTagFilter(tag: string) {
      return axios.get<Question[]>('/questions/filter/tag/'+tag).then((response) => response.data);
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
    return axios.get<Answer>('/answers/'+id).then((response) => response.data);
  }
  getAll(qId: number) {
    return axios.get<Answer[]>('/answers/question/' + qId).then((response) => response.data);
  }
  create(text: string) {
    return axios.post<number>('/answers',{text}).then(response => response.data)
  }
  edit(answer: Answer) {
    return axios.put('/answers', {answer}).then((response) => response.data);
  }
  delete(id: number) {
    return axios.delete('/answers/' + id).then((response) => response.data);
  }
}

class CommentService {
  getQuestions(qId: number) {
    return axios.get<Comment[]>('/comments/question/' + qId).then((response) => response.data);
  }
  getAnswer(qId: number) {
    return axios.get<Comment[]>('/comments/answer/' + qId).then((response) => response.data);
  }
  create(text: string) {
    return axios.post<number>('/comments',{text}).then(response => response.data)
  }
  edit(body: string) {
    return axios.put('/comments', {body}).then((response) => response.data);
  }
  delete(id: number) {
    return axios.delete('/comments/' + id).then((response) => response.data);
  }
}

class TagService {
    getAll() {
        return axios.get<any>('/tags').then((response) => response.data as Tag[])
    }
    create(tag: string) {
      
        return axios.post<Tag>('/tags',{tag}).then(response => response.data)
    }
    getQuestionTags(id:number) {
        return axios.get<Tag[]>('/tags/question/'+id).then((response) => response.data);
    }
    editQuestionTags(questionId: number, addedTags: number[], removedTags: number[]){
      return axios.post('/tags/'+ questionId, {addedTags, removedTags}).then(response => response.data)
    }
}

export const commentService = new CommentService();
export const questionService = new QuestionService();
export const answerService = new AnswerService();
export const authService = new AuthService()
export const profileService = new ProfileService()
export const tagService = new TagService()