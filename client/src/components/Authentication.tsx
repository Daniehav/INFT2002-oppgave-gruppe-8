import React, {useState, ChangeEvent, FormEvent, useContext} from 'react'
import { useNavigate } from 'react-router-dom'
import UploadImage from './UploadImage'
import defaultPfp from '../assets/default-pfp.png'
import { authService, profileService } from '../service'
import { AuthContext, ProfileContext } from '../context/Context'
import { Profile } from '../types'

function AuthenticationPage() {
    
    const [showSignIn, setShowSignIn] = useState(true)
    const [signedUp, setSignedUp] = useState(false)
    
    
    return(
        <div className='container justify-center'>
            {showSignIn && <SignInForm />}
            {!showSignIn && <SignUpForm signedUp={signedUp} setSignedUp={setSignedUp} />}
            {showSignIn && <p onClick={() => setShowSignIn(false)} className="center pointer fs-4 text-grey">or Create An Account</p>}
            {!showSignIn && !signedUp && <p onClick={() => setShowSignIn(true)} className="center pointer fs-4 text-grey">or Sign In</p>}
        </div>
    )

}

type signUpProps = {signedUp: boolean, setSignedUp: React.Dispatch<React.SetStateAction<boolean>>}

function SignUpForm({signedUp, setSignedUp}: signUpProps){ 
    
    const defaultFormFields = {
        username:'',
        email: '',
        password:'',
        confirmPassword:'',
    }

    const {setIsAuthenticated} = useContext(AuthContext)
    const {profile, setProfile} = useContext(ProfileContext)
    
    const navigate = useNavigate()
    
    const [formFields,setFormFields] = useState(defaultFormFields)
    const {username, email,password,confirmPassword} = formFields
    const [duplError, setDuplError] = useState(false)
    const [profilePicture, setProfilePicture] = useState<string | null>(null)
    const [bioText, setBioText] = useState('')
    const [displayName, setDisplayName] = useState('')


    const handleChange = (e:ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target
        setFormFields({...formFields,[name]: value})
    }

    const signUp = (e:FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if(!username || !password || password !== confirmPassword) return;
        setDuplError(false)
        //create user
        authService.signUp(username, email, password)
        .then((userId) => {
            setProfile(prev => {
                return {
                    user_id: userId
                } as Profile
            })
            setIsAuthenticated(true)
            setSignedUp(true)
            //if username is taken
        }).catch(error => {if(error.response.data.errno == 1062) setDuplError(true)});
    }

    const updateProfile = async () => {
        try {
            await profileService.update(profile.user_id, bioText, profilePicture, displayName)
            navigate('/')
        } catch (error) {
            console.log(error);
            navigate('/')
        }
    }
    

    return(
        <>
            {!signedUp ?
             <div className="card bg-white auth--card">
                <h3 className="text-accent">Sign up</h3>
                <form onSubmit={signUp}>
                    <FormInput label="Username" type="text" name="username" onChange={handleChange} value={username} />
                    <FormInput label="Email" type="text" name="email" onChange={handleChange} value={email} />
                    <FormInput label="Password" type="password" name="password" onChange={handleChange} value={password} />
                    <FormInput label="Confirm Password" type="password" name="confirmPassword" onChange={handleChange} value={confirmPassword} />
                    <button type="submit" className="auth-button fs-4">Sign Up</button>
                </form>
            </div>
            :
            <div className='flex-vert align-start card bg-white gap-05'>
                <h3 className='text-accent'>Complete your profile</h3>
                <div className='row'>
                    <UploadImage uploadImage={setProfilePicture} />
                    <img className='pfp pfp-l' src={profilePicture? profilePicture : defaultPfp} alt="" />
                </div>
                <div className="row">
                    <p className='fs-3 text-accent'>Display Name</p>
                    <input value={displayName} onChange={e => setDisplayName(e.currentTarget.value)} type="text" className="input" />
                </div>
                <p className='fs-3 text-accent'>Bio</p>
                <textarea className='textarea' value={bioText} onChange={e => setBioText(e.currentTarget.value)} cols={30} rows={5} maxLength={150}></textarea>
                <div className="row align-center">
                    <button className='button bg-light-grey text-black' onClick={() => navigate('/')}>Later</button>
                    <button className='button bg-accent text-WHITE' onClick={updateProfile}>Update</button>
                </div>
            </div>}
        </>
    )
}

function SignInForm(){ 
    
    const defaultFormFields = {
        username: '',
        password:'',
    }
    const navigate = useNavigate()

    const {setIsAuthenticated} = useContext(AuthContext)
    const {setProfile} = useContext(ProfileContext)


    const [formFields,setFormFields] = useState(defaultFormFields)
    const {username,password} = formFields

    const handleChange = (e:ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target
        setFormFields({...formFields,[name]: value})
    }

    const signIn = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if(!username || !password) return;
        await authService.signIn(username, password)
        setIsAuthenticated(true)
        const profile = await profileService.getProfileByUsername(username)
        setProfile(profile)
        navigate('/')
    }
   

    return(
        <div className="card bg-white auth--card">
            <h3 className="text-accent fs-2">Sign in</h3>

            <form onSubmit={signIn}>
                <FormInput label="Username" type="username" name="username" onChange={handleChange} value={username} />
                <FormInput label="Password" type="password" name="password" onChange={handleChange} value={password} />
                <button type="submit" className="auth-button fs-4">Sign In</button>
            </form>
        </div>
    )
}


type FormInputProps = {
    label: string,
    type: string,
    value: string,
    name: string,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

function FormInput({label, ...props}:FormInputProps){
    return(
        <div className="auth-field">
            <input placeholder=" " className="auth-input fs-4" {...props} required/>
            <label placeholder=" " className="auth-label fs-4">{label}</label>
        </div>
    )
}


export default AuthenticationPage