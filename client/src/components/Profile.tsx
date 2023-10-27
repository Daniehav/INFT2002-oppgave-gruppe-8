import React, {useContext, useState} from "react";
import { profileService } from "../service";
import { ProfileContext } from "../context/Context";
import defaultPfp from '../assets/default-pfp.png'
import UploadImage from "./UploadImage";
import { useNavigate } from "react-router-dom";
import Pfp from "./Pfp";
function Profile() {

    const {profile} = useContext(ProfileContext)
    const [profilePicture, setProfilePicture] = useState<string | null>(null)
    const [bioText, setBioText] = useState(profile.bio)
    const [edit, setEdit] = useState(false)
    const navigate = useNavigate()

    const updateProfile = async () => {
        try {
            await profileService.update(profile.user_id, bioText, profilePicture)
            navigate('/')
        } catch (error) {
            navigate('/')
            console.log(error);
        }
    }

    return ( 
        <div className="container">
            <div className="user-profile">
                <div className="card bg-white text-black user-card">
                    <h3 className='text-accent fs-2'>Profile</h3>
                    <div className="row">
                        <p className="fs-3">Followers: 0</p>
                        <Pfp size="l" pfp={profilePicture? profilePicture : profile.profile_picture} />
                        <p className="fs-3">Following: 0</p>
                    </div>
                    <UploadImage show={edit} uploadImage={setProfilePicture}/>
                    <textarea className='bio' value={edit? bioText : profile.bio} onChange={e => setBioText(e.currentTarget.value)} cols={30} rows={5} maxLength={150} disabled={!edit}></textarea>
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
                <div className="posts card bg-white text-black">
                    <h3 className="fs-2 text-accent">No posts yet</h3>

                </div>
            </div>
        </div> 
    );
}

export default Profile;