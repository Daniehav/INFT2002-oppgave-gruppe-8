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
    // get profile from user id
    get(userId: number) {
        return axios.get<Profile>('/profile/' + userId).then(res => res.data)
    }

    update(userId: number, bio: string, pfp: string | null, displayName: string) {
        return axios.put<boolean>('/profile/'+ userId, {bio, pfp, displayName})
    }
    getProfileByUsername(username: string) {
      return axios.get<Profile>('/profile/u/' + username).then((response) => response.data);
    }
}

class QuestionService {
  get(id: number) {
    return axios.get<Question>('/questions/' + id).then((response) => response.data);
  }
  // get question from user
  getQuestionsUser(userId: number) {
    return axios.get<Question[]>('/questions/profile/'+ userId).then(response => response.data)
  } 

  //search for questions
  search(text: string, cancelToken?: CancelTokenSource ) {
    return axios.get<Question[]>('/questions/search/'+text,cancelToken?{cancelToken: cancelToken.token} : {}).then((response) => response.data);
  }

  create(userId: number, title: string, body: string, tags: number[]) {
    return axios.post<string>('/questions', {userId, title, body, tags}).then((response) => response.data);
  }
  // preview of filtered question list
  getPreview(category: 'popular' | 'recent' | 'unanswered') {
    return axios.get<Question[]>('/questions/preview/'+ category).then((response) => response.data);
  }
  //filtered question list
  getFilter(filter: string) {
      return axios.get<Question[]>('/questions/filter/'+filter).then((response) => response.data);
  }
  //question list filtered by tag
  getTagFilter(tag: string) {
      return axios.get<Question[]>('/questions/filter/tag/'+tag).then((response) => response.data);
  }
  //edit question
  edit(questionId: number, title: string, body: string) {
    return axios.put('/questions/'+ questionId, {title, body}).then((response) => response.data);
  }
  //delete question
  delete(id: number) {
    return axios.delete('/questions/' + id).then((response) => response.data);
  }
  //mark answer as accepted
  accept(questionId: number, answerId: number, userId: number) {
    return axios.put(`/questions/${questionId}/accept/${answerId}`,{userId}).then(response => response.data)
  }
}

class AnswerService {
	//get answer from id (to load edit)
  get(id: number) {
    return axios.get<Answer>('/answers/'+id).then((response) => response.data);
  }
  //get all answers from question 
  getAll(qId: number) {
    return axios.get<Answer[]>('/answers/question/' + qId).then((response) => response.data);
  }
  //create answer to question
  create(questionId:number, body: string) {
    return axios.post<number>('/answers',{questionId,body}).then(response => response.data)
  }
  //edit answer
  edit(answer: Answer) {
    return axios.put('/answers/'+ answer.answer_id, {body: answer.body}).then((response) => response.data);
  }
  //delete answer
  delete(id: number) {
    return axios.delete('/answers/' + id).then((response) => response.data);
  }
  //vote on answer
  vote(answerId: number, vote: 'upvote' | 'downvote') {
    return axios.post('/answers/'+ answerId+'/vote', {vote}).then(response => response.data)
  }
}


class CommentService {
	//get all commenst from question or answer
  get(parent: string, parentId: number) {
    return axios.get<QuestionComment[] | AnswerComment[]>(`/comments/${parent}/${parentId}`).then((response) => response.data);
  }
  //create comment to question or answer
  create(parent: string, parentId: number, body: string) {
    return axios.post<number>(`/comments/${parent}/${parentId}`,{body}).then(response => response.data)
  }
  //edit comment to question or answer
  edit(commentId: number,parent: string,body: string) {
    return axios.put(`/comments/${parent}/${commentId}`, {body}).then((response) => response.data);
  }
  //delete comment from question or answer
  delete(commentId: number,parent: string) {
    return axios.delete(`/comments/${parent}/${commentId}`).then((response) => response.data);
  }


}

class TagService {
	//get all tags
    getAll() {
        return axios.get<any>('/tags').then((response) => response.data as Tag[])
    }
	//create new tag
    create(tag: string) {
      
        return axios.post<Tag>('/tags',{tag}).then(response => response.data)
    }
	//get all tags of question
    getQuestionTags(id:number) {
        return axios.get<Tag[]>('/tags/question/'+id).then((response) => response.data);
    }
	//edit tags of question
    editQuestionTags(questionId: number, addedTags: number[], removedTags: number[]){
      return axios.post('/tags/edit/'+ questionId, {addedTags, removedTags}).then(response => response.data)
    }
}

class FavoriteService {
	//get all favorite answers of user
  getFavorites(userId: number) {
    return axios.get<Answer[]>('/favorites/'+userId).then(response => response.data)
  }
  //get all favorite answer ids of user
  getFavoriteIds() {
    return axios.get<number[]>('/favorites').then(response => response.data)
  }
  //set a favorite answer
  setFavorite(answerId: number){
    return axios.post<void>('/favorites/'+answerId).then(response => response.data)
  }
}

export const commentService = new CommentService();
export const questionService = new QuestionService();
export const answerService = new AnswerService();
export const authService = new AuthService()
export const profileService = new ProfileService()
export const tagService = new TagService()
export const favoriteService = new FavoriteService()