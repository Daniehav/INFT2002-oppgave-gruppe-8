import React, { createContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../service';
import { Profile } from '../types';

type AuthContextType = {
  isAuthenticated: boolean,
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>,
  logOut: () => void
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

type ProviderProps = {
  children: ReactNode;
}

export const AuthProvider: React.FC<ProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigate = useNavigate()


  const logOut = () => {
    authService.logOut()
    .then(() => {
        setIsAuthenticated(false)
        navigate('/login')
    });
}

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

type ThemeContextType = {
  isDark: boolean,
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);


export const ThemeProvider: React.FC<ProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark((prevIsDark) => !prevIsDark);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

type ProfileContextType = {
  profile: Profile,
  setProfile: React.Dispatch<React.SetStateAction<Profile>>
}

export const ProfileContext = createContext<ProfileContextType>({} as ProfileContextType);


export const ProfileProvider: React.FC<ProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<Profile>({} as Profile);

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};


