import React,{useState, useContext, useEffect, useRef} from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes, Link } from 'react-router-dom';
import { authService, profileService } from './service';
import Home, {Tags} from './Home'
import {Profile, ProfileEdit} from './components/Profile';
import AuthenticationPage from './components/Authentication';
import { ThemeContext, ThemeProvider, AuthProvider, AuthContext, ProfileProvider, ProfileContext } from './context/Context';
import './app.css'
import { useNavigate } from 'react-router-dom';
import Pfp from './components/Pfp';
import { QuestionDetails, EditQuestion, EditAnswer, FilteredQuestions, CreateQuestion, CreateAnswer, CreateComment, EditComment} from './components/Questions'




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
		<div className={`app bg-light-grey text-black ${isDark? 'dark-mode' : ''}`}>
			<Header showMenu={showMenu} setShowMenu={setShowMenu}/>
			{showMenu && <div onClick={() => setShowMenu(false)} className='hide-onclick'></div>}
			<Routes>
				<Route path="/" element={<Home/>}>
					<Route path='/tags' element={<Tags />}/>
					<Route path="/question/:id" element={<QuestionDetails />}>
						<Route path="/question/:id/answer/create" element={<CreateAnswer />} />
						<Route path="/question/:id/answer/:answerId/edit" element={<EditAnswer />} />
						{/* <Route path="/question/:id/comment/create" element={<CreateComment />} /> */}
						{/* <Route path="/question/:id/comment/:commentId/edit" element={<EditComment />} /> */}

					</Route>
					<Route path="/question/:id/edit" element={<EditQuestion />} />
					<Route path="/question/create" element={<CreateQuestion />} />
					<Route path="/question/filter/:filter" element={<FilteredQuestions />} />
					<Route path="/question/filter/:filter/:tag" element={<FilteredQuestions />} />
				</Route>
				<Route path="/login" element={<AuthenticationPage/>} />
				<Route path="/profile" element={<Profile/>} />
				<Route path="/profile/edit" element={<ProfileEdit/>} />
				<Route path="/profile/:profileId" element={<Profile/>} />
			</Routes>
		</div>
  )
}



export default function Header({showMenu, setShowMenu}: {showMenu: boolean, setShowMenu: React.Dispatch<React.SetStateAction<boolean>>} ) {
    
    const {profile} = useContext(ProfileContext)
    const {isDark,toggleTheme} = useContext(ThemeContext)
    const {isAuthenticated, logOut} = useContext(AuthContext)
    const navigate = useNavigate()


    return(
        <header className='header bg-light-grey text-black'>
            <Link to={'/'} className='fs-1'><span className="text-accent">Q</span>&<span className="text-accent">A</span> Platform</Link>
            {isAuthenticated? <>
			//sett søkebar
			 <div className='nav gap-2 flex align-end'>
                <div className='pointer' onClick={() => setShowMenu(true)}>
                    <Pfp size='s' pfp={profile.profile_picture} level={profile.level} />
                </div>
            </div>
			<div className={`user-menu ${!showMenu && 'user-menu--hide'}`}>
				<button className='text-black' onClick={() => navigate('/')}>Home</button>
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
