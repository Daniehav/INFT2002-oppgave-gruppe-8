import React, {useContext, useState, useEffect} from "react";
import { favoriteService, profileService, questionService } from "../service";
import { ProfileContext } from "../context/Context";
import UploadImage from "./UploadImage";
import { useNavigate, useParams } from "react-router-dom";
import { Question, Answer, Profile } from "../types";
import Pfp from "./Pfp";

export function YourProfile() {

    const {profile} = useContext(ProfileContext)

    return(
        <ProfileComponent profile={profile} isYour={true} />
    )

}
export function OthersProfile() {

     
    const {username} = useParams()
    const [profile, setProfile] = useState<Profile>()

    useEffect(() => {
        if(!username) return
        const fetchProfile = async () => {
            const profile = await profileService.getProfileByUsername(username)
            setProfile(profile)
        }
        fetchProfile()
    }, []);


    return(
        <ProfileComponent profile={profile ?? null} isYour={false} />
    )

}

function ProfileComponent({profile, isYour}: {profile: Profile | null, isYour: boolean}) {

    if(!profile){
        return <div>404 Profile not found</div>
    }


    const [questions, setQuestions] = useState<Question[]>([])
    const [favorites, setFavorites] = useState<Answer[]>([])
    const [showQuestions, setShowQuestions] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const fetch = async () => {
            try {
                if(!profile.user_id) return
                const questions = await questionService.getQuestionsUser(profile.user_id)
                setQuestions(questions)
                const favorites = await favoriteService.getFavorites(profile.user_id)
                setFavorites(favorites)
            } catch (error) {
                console.log(error);
            }
        }
        fetch()
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
            <div className="card bg-white text-black user-card wide-75 gap-05">
                <h3 className='text-accent fs-2'>Profile</h3>
                <div className="row">
                    <Pfp size="l" pfp={profile.profile_picture} level={profile.level} />
                </div>
                <p className="fs-2">{profile.display_name}</p>
                <textarea className='textarea' value={profile.bio} cols={30} rows={5} maxLength={150} disabled></textarea>
                {isYour && <button className='button bg-accent text-WHITE fs-4' onClick={() => navigate('/profile/edit')}>Edit</button>}
            </div> 
            <div className="card wide-75 bg-white">
                <div className="row wide-100 space-between">
                    <p onClick={() => setShowQuestions(true)} className="fs-2 text-black">{questions.length == 0?'No posts yet' : questions.length + ' questions'}</p> 
                    <p onClick={() => setShowQuestions(false)} className="fs-2 text-black">{favorites.length == 0?'No favorites yet' : favorites.length + ' favorites'}</p> 
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
    const [nameEdit, setNameEdit] = useState('')
    const [bioText, setBioText] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        if(!profile) return
        setBioText(profile.bio)
        setNameEdit(profile.display_name)
        setProfilePicture(profile.profile_picture)
    }, [profile]);

    const updateProfile = async () => {
        try {
            if(!profile.user_id) return
            await profileService.update(profile.user_id, bioText, profilePicture, nameEdit)
            navigate('/profile')
        } catch (error) {
            navigate('/profile')
            console.log(error);
        }
    }
    return (
        <div className="container justify-center wide-100">
            <div className="card bg-white text-black user-card wide-75 gap-05">
                <h3 className='text-accent fs-2'>Profile</h3>
                <div className="row">
                    <Pfp size="l" pfp={profilePicture? profilePicture : profile.profile_picture} level={profile.level} />
                </div>
                <input className="input" value={nameEdit} onChange={e => setNameEdit(e.currentTarget.value)} type="text" />
                <UploadImage uploadImage={setProfilePicture}/>
                <textarea className='textarea' value={bioText} onChange={e => setBioText(e.currentTarget.value)} cols={30} rows={5} maxLength={150}></textarea>
                <div className="row align-center">
                    <button className='button bg-light-grey text-black fs-4' onClick={() => navigate('/profile')}>Cancel</button>
                        <button className='button bg-accent text-WHITE fs-4' onClick={updateProfile}>Update</button>
                </div>
            </div> 
        </div> 
    );
}
