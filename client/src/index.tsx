import React,{useState, useContext, useEffect, useRef} from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { authService, profileService } from './service';
import Home, {Tags} from './Home'
import Profile from './components/Profile';
import AuthenticationPage from './components/Authentication';
import { ThemeContext, ThemeProvider, AuthProvider, AuthContext, ProfileProvider, ProfileContext } from './context/Context';
import './app.css'
import { useNavigate } from 'react-router-dom';
import Pfp from './components/Pfp';
import { QuestionDetails, EditQuestion, EditAnswer, FilteredQuestions} from './components/Questions'




function App() {

	const [showMenu, setShowMenu] = useState(false)
	const {isDark} = useContext(ThemeContext)
	const {isAuthenticated, setIsAuthenticated} = useContext(AuthContext)
	const {setProfile} = useContext(ProfileContext)

    
    useEffect(() => {
		const checkAuth = async () => {
			const id = await authService.checkAuth()
			console.log(id) 
			setIsAuthenticated(true)
			if(!id) return
			const profile = await profileService.get(id)
			console.log(profile);
			setProfile(profile)
		} 
		checkAuth()
    }, []);

	return(
		<div className={`app text-black ${isDark && 'dark-mode'}`}>
			<Header showMenu={showMenu} setShowMenu={setShowMenu}/>
			{showMenu && <div onClick={() => setShowMenu(false)} className='hide-onclick'></div>}
			<Routes>
				<Route path="/" element={<Home/>}>
					<Route path='/tags' element={<Tags />}/>
					<Route path="/q/:id" element={<QuestionDetails />} />
					<Route path="/q/filter/:filter" element={<FilteredQuestions />} />
					<Route path="/a/:id(\d+)/edit" element={<EditAnswer />} />
					<Route path="/q/:id(\d+)/edit" element={<EditQuestion />} />
				</Route>
				<Route path="/login" element={<AuthenticationPage/>} />
				<Route path="/profile" element={<Profile/>} />
			</Routes>
		</div>
  )
}



export default function Header({showMenu, setShowMenu}: {showMenu: boolean, setShowMenu: React.Dispatch<React.SetStateAction<boolean>>} ) {
    
    const {profile} = useContext(ProfileContext)
    const {isDark,toggleTheme} = useContext(ThemeContext)
    const {isAuthenticated, logOut} = useContext(AuthContext)
    const navigate = useNavigate()
	const menuRef = useRef(null)


    return(
        <header className='header bg-light-grey text-black'>
            <h1><span className="text-accent">Q</span>&<span className="text-accent">A</span> Platform</h1>
            {isAuthenticated? <> <div className='nav gap-2 flex align-end'>
                <div className='pointer' onClick={() => setShowMenu(true)}>
                    <Pfp size='s' pfp={profile.profile_picture} />
                </div>
            </div>
			<div className={`user-menu ${!showMenu && 'user-menu--hide'}`}>
				<button className='text-black' onClick={() => navigate('/profile')}>Profile</button>
				<button className='text-black' onClick={toggleTheme}>{isDark? 'Light Mode' :'Dark Mode'}</button>
				<button className='text-black' onClick={logOut}>Log out</button>
			</div>
			</>
			:
			<button onClick={() => navigate('/login')}>Sign In</button>}
        </header>
    )
}




let root = document.getElementById('root');
if (root)
  createRoot(root).render(
	<HashRouter>
		<ThemeProvider>
			<AuthProvider>
				<ProfileProvider>
					<App/>	
				</ProfileProvider>
			</AuthProvider>
		</ThemeProvider>
	</HashRouter>
);
