import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate ,useNavigate} from 'react-router-dom';
import { Dashboard } from './pages/Dashboard'
import {AuthPage} from './pages/AuthPage'
import {usePosts} from './hooks/usePosts'
import {useAuth} from './hooks/useAuth'
import { Toaster } from 'react-hot-toast';

function App() {

  const auth= useAuth();
  const post=usePosts(auth.token);

  useEffect(() => {
    if(auth.isLoggedIn && auth.token){
    auth.fetchProfile();
    //auth.fetchUsers();
    post.fetchDrafts();
    post.fetchPosts();
    }
  }, [auth.isLoggedIn,auth.token]);

  return (
  <BrowserRouter>
  <Toaster 
      position="top-center" 
      toastOptions={{
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        },
      }} 
    />
    <Routes>
      {/* RUTA 1: LOGIN I REGISTRACIJA */}
      <Route 
        path="/" 
        element={
          !auth.isLoggedIn ? (<AuthPage auth={auth}/>) : (<Navigate to="/dashboard" />)
        } 
      />
      {/* RUTA 2: DASHBOARD (LISTA KORISNIKA) */}
      <Route 
        path="/dashboard" 
        element={
          auth.isLoggedIn ? ( <Dashboard auth={auth} post={post}/>) : (<Navigate to="/" />)
        } 
      />

    </Routes>
  </BrowserRouter>
);
}

export default App
