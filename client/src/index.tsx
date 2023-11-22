import React,{useState, useContext, useEffect, useRef} from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes, Link } from 'react-router-dom';
import { authService, profileService } from './service';
import Home, {Tags} from './Home'
import {YourProfile, OthersProfile, ProfileEdit} from './components/Profile';
import AuthenticationPage from './components/Authentication';
import { ThemeContext, ThemeProvider, AuthProvider, AuthContext, ProfileProvider, ProfileContext } from './context/Context';
import './app.css'
import { useNavigate } from 'react-router-dom';
import Pfp from './components/Pfp';
import {Searchbar, SearchList} from './components/Searchbar'
import { QuestionDetails, EditQuestion, FilteredQuestions, CreateQuestion} from './components/Questions'
import { EditAnswer, CreateAnswer} from './components/Answers'




function App() {

	const {isDark} = useContext(ThemeContext)
	const {isAuthenticated, setIsAuthenticated} = useContext(AuthContext)
	const {setProfile} = useContext(ProfileContext)
	
    
    useEffect(() => {
		const checkAuth = async () => {
			const id = await authService.checkAuth()
			setIsAuthenticated(true)
			if(!id) return
			const profile = await profileService.get(id)
			setProfile(profile)
		} 
		checkAuth()
    }, [isAuthenticated]);

	return(
		<div className={`app bg-light-grey text-black ${isDark? 'dark-mode' : ''}`}>
			<Header />
			<Routes>
				<Route path="/" element={<Home/>}>
					<Route path='/tags' element={<Tags />}/>
					<Route path="/question/:id" element={<QuestionDetails />}>
						<Route path="/question/:id/answer/create" element={<CreateAnswer />} />
						<Route path="/question/:id/answer/:answerId/edit" element={<EditAnswer />} />
					</Route>
					<Route path="/question/:id/edit" element={<EditQuestion />} />
					<Route path="/question/create" element={<CreateQuestion />} />
					<Route path="/question/filter/:filter" element={<FilteredQuestions />} />
					<Route path="/question/filter/:filter/:tag" element={<FilteredQuestions />} />
					<Route path="/question/:id/edit" element={<EditQuestion />} />
					<Route path="/question/search/:query/results" element={<SearchList />} />
				</Route>
				<Route path="/login" element={<AuthenticationPage/>} />
				<Route path="/profile" element={<YourProfile/>} />
				<Route path="/profile/edit" element={<ProfileEdit/>} />
				<Route path="/profile/:username" element={<OthersProfile/>} />
			</Routes>
		</div>
  )
}



export default function Header() {
	
	const [showMenu, setShowMenu] = useState(false)
	const {profile} = useContext(ProfileContext)
    const {isDark,toggleTheme} = useContext(ThemeContext)
    const {isAuthenticated, logOut} = useContext(AuthContext)
    const navigate = useNavigate()
	
    return(
		<header className='header bg-light-grey text-black'>
			{(showMenu ) && <div onClick={() => {setShowMenu(false)}} className='hide-onclick'></div>}
            <Link to={'/'} className='fs-1'><span className="text-accent">Q</span>&<span className="text-accent">A</span> Platform</Link>

			 <div className='nav gap-2 flex align-center'>
				<Searchbar />
            </div>
            {isAuthenticated? <>
                <div className='pointer' onClick={() => setShowMenu(true)}>
                    <Pfp size='s' pfp={profile.profile_picture} level={profile.level} />
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
