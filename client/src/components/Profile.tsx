import React, {useContext, useState, useEffect} from "react";
import { favoriteService, profileService, questionService } from "../service";
import { ProfileContext } from "../context/Context";
import UploadImage from "./UploadImage";
import { useNavigate } from "react-router-dom";
import { Question, Answer } from "src/types";
import Pfp from "./Pfp";

export function Profile() {

    const {profile} = useContext(ProfileContext)
    const [profilePicture, setProfilePicture] = useState<string | null>(null)
    const [nameEdit, setNameEdit] = useState(profile.display_name)
    const [bioText, setBioText] = useState(profile.bio)
    
    const [edit, setEdit] = useState(false)
    const [questions, setQuestions] = useState<Question[]>([])
    const [favorites, setFavorites] = useState<Answer[]>([])
    const [showQuestions, setShowQuestions] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchQuestions = async () => {
            if(!profile.user_id) return
            const questions = await questionService.getQuestionsUser(profile.user_id)
            setQuestions(questions)
            const favorites = await favoriteService.getFavorites()
            setFavorites(favorites)
        }
        fetchQuestions()
    }, [profile]);

    const questionElements = questions.map((q,i) => (
        <div key={i} onClick={() => navigate('/question/'+ q.question_id)} className="pointer card bg-white wide-75 row">
            <p className="fs-2">{q.title}</p>
            <p>Answers: {q.answer_count}</p>
            <p>Views: {q.views}</p>
        </div>
    ))
    const favoriteElements = favorites.map((a,i) => (
        <div key={i} onClick={() => navigate(`/question/${a.question_id}`)} className="pointer card bg-white wide-75">
            <p>Q: {a.question_title}</p>
            <p>A: {a.body}</p>
        </div>
    ))

    return ( 
        <div className="container justify-center wide-100">
            <div className="card bg-white text-black user-card wide-75">
                <h3 className='text-accent fs-2'>Profile</h3>
                <div className="row">
                    <p className="fs-3">Followers: 0</p>
                    <Pfp size="l" pfp={profilePicture? profilePicture : profile.profile_picture} level={profile.level} />
                    <p className="fs-3">Following: 0</p>
                </div>
                <p className="fs-2">{profile.display_name}</p>
                <UploadImage show={false} uploadImage={setProfilePicture}/>
                <textarea className='textarea' value={profile.bio} onChange={e => setBioText(e.currentTarget.value)} cols={30} rows={5} maxLength={150} disabled></textarea>
                <button className='button bg-accent fs-4' onClick={() => navigate('/profile/edit')}>Edit</button>
            </div> 
            <div className="card wide-75 bg-white">
                <div className="row wide-100 space-between">
                    <p onClick={() => setShowQuestions(true)} className="fs-2 text-black">{questions.length == 0?'No posts yet' : questions.length + ' questions'}</p> 
                    <p onClick={() => setShowQuestions(false)} className="fs-2 text-black">{favorites.length == 0?'No posts yet' : favorites.length + ' favorites'}</p> 
                </div>
                <div className='flex wide-100 underline-container'>
                    <div className={`underline ${showQuestions? 'underline-left' : 'underline-right'}`}></div>
                </div>
            </div>

            {showQuestions? questionElements : favoriteElements}
        </div> 
    );
}

export function ProfileEdit() {
    const {profile} = useContext(ProfileContext)
    const [profilePicture, setProfilePicture] = useState<string | null>(null)
    const [nameEdit, setNameEdit] = useState(profile.display_name)
    const [bioText, setBioText] = useState(profile.bio)
    const navigate = useNavigate()

    const updateProfile = async () => {
        try {
            const update = await profileService.update(profile.user_id, bioText, profilePicture, nameEdit)
            navigate('/profile')
        } catch (error) {
            navigate('/profile')
            console.log(error);
        }
    }
    return (
        <div className="container justify-center wide-100">
            <div className="card bg-white text-black user-card wide-75">
                <h3 className='text-accent fs-2'>Profile</h3>
                <div className="row">
                    <Pfp size="l" pfp={profilePicture? profilePicture : profile.profile_picture} level={profile.level} />
                </div>
                <input className="input" value={nameEdit} onChange={e => setNameEdit(e.currentTarget.value)} type="text" />
                <UploadImage show={true} uploadImage={setProfilePicture}/>
                <textarea className='textarea' value={bioText} onChange={e => setBioText(e.currentTarget.value)} cols={30} rows={5} maxLength={150}></textarea>
                <div className="row align-center">
                    <button className='button bg-light-grey text-black fs-4' onClick={() => navigate('/profile')}>Cancel</button>
                        <button className='button bg-accent fs-4' onClick={updateProfile}>Update</button>
                </div>
            </div> 
        </div> 
    );
}
