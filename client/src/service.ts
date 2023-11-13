import axios, {CancelTokenSource} from "axios";
import { Profile, Question, Answer, QuestionComment, AnswerComment, Tag } from "./types";

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

  
  search(text: string, cancelToken?: CancelTokenSource ) {
    return axios.get<Question[]>('/questions/search/'+text,cancelToken?{cancelToken: cancelToken.token} : {}).then((response) => response.data);
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
  edit(questionId: number, title: string, body: string) {
    return axios.put('/questions/'+ questionId, {title, body}).then((response) => response.data.id);
  }
  delete(id: number) {
    return axios.delete('/questionsR/' + id).then((response) => response.data.id);
  }
  accept(questionId: number, answerId: number, userId: number) {
    return axios.put(`/questions/${questionId}/accept/${answerId}`,{userId}).then(response => response.data)
  }
}

class AnswerService {
  get(id: number) {
    return axios.get<Answer>('/answers/'+id).then((response) => response.data);
  }
  getAll(qId: number) {
    return axios.get<Answer[]>('/answers/question/' + qId).then((response) => response.data);
  }
  create(questionId:number, answer: string) {
    return axios.post<number>('/answers',{questionId,answer}).then(response => response.data)
  }
  edit(answer: Answer) {
    return axios.put('/answers/'+ answer.answer_id, {body: answer.body}).then((response) => response.data);
  }
  delete(id: number) {
    return axios.delete('/answers/' + id).then((response) => response.data);
  }
  vote(answerId: number, vote: 'upvote' | 'downvote') {
    return axios.post('/answers/'+ answerId+'/vote', {vote}).then(response => response.data)
  }
  favorite(answerId: number) {
    return axios.post('/ans')
  }
}


class CommentService {
  get(parent: string, parentId: number) {
    return axios.get<QuestionComment[] | AnswerComment[]>(`/comments/${parent}/${parentId}`).then((response) => response.data);
  }
  create(parent: string, parentId: number, body: string) {
    return axios.post<void>(`/comments/${parent}/${parentId}`,{body}).then(response => response.data)
  }
  edit(commentId: number,parent: string,body: string) {
    return axios.put(`/comments/${parent}/${commentId}`, {body}).then((response) => response.data);
  }
  delete(commentId: number,parent: string) {
    return axios.delete(`/comments/${parent}/${commentId}`).then((response) => response.data);
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
      return axios.post('/tags/edit/'+ questionId, {addedTags, removedTags}).then(response => response.data)
    }
}

class FavoriteService {
  getFavorites() {
    return axios.get('/favorites').then(response => response.data)
  }
  getFavoriteIds() {
    return axios.get('/favorites/ids').then(response => response.data)
  }
  setFavorite(answerId: number){
    return axios.post('/favorites/'+answerId).then(response => response.data)
  }
}

export const commentService = new CommentService();
export const questionService = new QuestionService();
export const answerService = new AnswerService();
export const authService = new AuthService()
export const profileService = new ProfileService()
export const tagService = new TagService()
export const favoriteService = new FavoriteService()