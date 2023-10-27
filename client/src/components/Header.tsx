import React, {useState, useContext, useEffect} from 'react'
import { ThemeContext, AuthContext, ProfileContext } from '../context/Context';
import { useNavigate } from 'react-router-dom';
import defaultPfp from '../assets/default-pfp.png'
import Pfp from './Pfp';


export default function Header( ) {
    
    const [showMenu, setShowMenu] = useState(false)
    const {isAuthenticated} = useContext(AuthContext)
    const {profile} = useContext(ProfileContext)

    return(
        <header className='header bg-light-grey text-black flex space-around'>
            <h1><span className="text-accent">Q</span>&<span className="text-accent">A</span> Platform</h1>
            <div className='nav gap-2 flex align-end'>
                <div className='pointer' onClick={() => setShowMenu(prev => !prev)}>
                    <Pfp size='s' pfp={profile.profile_picture} />
                </div>
            </div>
            <UserMenu show={showMenu}/>
        </header>
    )
}

function UserMenu({show}: {show: boolean}) {

    const {isDark,toggleTheme} = useContext(ThemeContext)
    const {isAuthenticated, logOut} = useContext(AuthContext)
    const navigate = useNavigate()

    return(
        <div className={`user-menu ${!show && 'user-menu--hide'}`}>
            <button className='text-black' onClick={() => navigate('/profile')}>Profile</button>
            <button className='text-black' onClick={toggleTheme}>{isDark? 'Light Mode' :'Dark Mode'}</button>
            {isAuthenticated? <button className='text-black' onClick={logOut}>Log out</button> : <button onClick={() => navigate('/login')}>Sign In</button>}
        </div>
    )
}