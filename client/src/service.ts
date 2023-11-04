import axios from "axios";
import { Profile, Question } from "./types";
import FormData from "form-data"
import fs from 'fs'

axios.defaults.baseURL = 'http://localhost:3000/api/v1';

class AuthService {
    signIn(username: string, password: string){
        return axios.post<string>('/auth/signin', {username, password }).then(res => parseInt(res.data))
    }
    signUp(username: string, password: string){
        return axios.post<string>('/auth/signup', {username, password }).then(res => parseInt(res.data))
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
    search(query: string){
        return axios.get<Question[]>('/question/search/'+query)
    }
}

export const authService = new AuthService()
export const profileService = new ProfileService()
export const questionService = new QuestionService()