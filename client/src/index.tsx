import React,{useState, useContext, useEffect} from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { authService, profileService } from './service';
import Home from './Home'
import Profile from './components/Profile';
import AuthenticationPage from './components/Authentication';
import { ThemeContext, ThemeProvider, AuthProvider, AuthContext, ProfileProvider, ProfileContext } from './context/Context';
import './app.css'
import Header from './components/Header'


function App() {

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
		<div className={`app bg-light-grey text-black ${isDark && 'dark-mode'}`}>
			{isAuthenticated && <Header/>}
			<Routes>
				<Route path="/" element={<Home/>} />
				<Route path="/login" element={<AuthenticationPage/>} />
				<Route path="/profile" element={<Profile/>} />
			</Routes>
		</div>
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
