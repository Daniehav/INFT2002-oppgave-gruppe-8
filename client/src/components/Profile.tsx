import React, {useContext, useState, useEffect} from "react";
import { profileService, questionService } from "../service";
import { ProfileContext } from "../context/Context";
import defaultPfp from '../assets/default-pfp.png'
import UploadImage from "./UploadImage";
import { useNavigate } from "react-router-dom";
import { Question } from "src/types";
import Pfp from "./Pfp";
function Profile() {

    const {profile} = useContext(ProfileContext)
    const [profilePicture, setProfilePicture] = useState<string | null>(null)
    const [nameEdit, setNameEdit] = useState(profile.display_name)
    const [bioText, setBioText] = useState(profile.bio)
    const [edit, setEdit] = useState(false)
    const [questions, setQuestions] = useState<Question[]>([])
    const navigate = useNavigate()

    useEffect(() => {
        const fetchQuestions = async () => {
            if(!profile.user_id) return
            const questions = await questionService.getQuestionsUser(profile.user_id)
            console.log(questions);
            
            setQuestions(questions)
        }
        fetchQuestions()
    }, [profile]);

    const updateProfile = async () => {
        try {
            const update = await profileService.update(profile.user_id, bioText, profilePicture, nameEdit)
            navigate('/')
        } catch (error) {
            navigate('/')
            console.log(error);
        }
    }

    const questionElements = questions.map((q,i) => (
        <div key={i} onClick={() => navigate('/question/'+ q.question_id)} className="pointer card bg-white wide-75 row">
            <p className="fs-2">{q.title}</p>
            <p>Answers: {q.answer_count}</p>
            <p>Views: {q.views}</p>
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
                {edit? <input className="input" value={nameEdit} onChange={e => setNameEdit(e.currentTarget.value)} type="text" /> :<p className="fs-2">{profile.display_name}</p>}
                <UploadImage show={edit} uploadImage={setProfilePicture}/>
                <textarea className='textarea' value={edit? bioText : profile.bio} onChange={e => setBioText(e.currentTarget.value)} cols={30} rows={5} maxLength={150} disabled={!edit}></textarea>
                <div className="row align-center">
                    {!edit?
                        <>
                            <button className='button bg-light-grey text-black fs-4' onClick={() => navigate('/')}>Back</button>
                            <button className='button bg-accent fs-4' onClick={() => setEdit(true)}>Edit</button>
                        </>
                        :
                        <>
                            <button className='button bg-light-grey text-black fs-4' onClick={() => setEdit(false)}>Cancel</button>
                            <button className='button bg-accent fs-4' onClick={updateProfile}>Update</button>
                        </>
                    }
                </div>
            </div> 
            {questions.length == 0? <h3 className="card wide-75 bg-white fs-2 text-accent">No posts yet</h3> :
                 <>
                    <p className="fs-2 card wide-75 bg-white">{questions.length} questions</p>
                    {questionElements}
                 </>

            }

        </div> 
    );
}

export default Profile;