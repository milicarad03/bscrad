import { useEffect} from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import { Dashboard } from './pages/Dashboard'
import {AuthPage} from './pages/AuthPage'
import {DeviceDetailsPage} from './pages/DeviceDetailsPage'
import {usePosts} from './hooks/usePosts'
import {useDevice} from './hooks/useDevice'
import {useAuth} from './hooks/useAuth'
import { Toaster } from 'react-hot-toast';
import { setUnauthorizedHandler } from './api/client';

function App() {

  const auth= useAuth();
  const post=usePosts(auth.token);
  const device=useDevice(auth.token);
  useEffect(() => {
    setUnauthorizedHandler(() => {
      auth.handleLogout();
    });
  }, []);

 useEffect(() => {
  if (auth.isLoggedIn && auth.token) {
    auth.fetchProfile();
    post.fetchDrafts();
    post.fetchPosts();
  }
}, [auth.isLoggedIn, auth.token]);


useEffect(() => {
  if (auth.isLoggedIn && auth.profile?.id) {
    device.fetchDevices(); 
    
    if (auth.profile.role === "ADMIN") {
      auth.fetchUsers();
    }
  }
}, [auth.isLoggedIn , auth.profile?.id, auth.profile?.role]);

  return (
  <BrowserRouter>
  <Toaster 
      position="top-center" 
      toastOptions={{
        duration: 3000,
        style: {
          background: '#333',
          fontFamily: 'Raleway, sans-serif',
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
          auth.isLoggedIn ? ( <Dashboard auth={auth} post={post} device={device}/>) : (<Navigate to="/" />)
        } 
      />
      <Route 
            path="/device/:id"  element={ auth.isLoggedIn ? ( <DeviceDetailsPage auth={auth} /> ) : ( <Navigate to="/" /> )
  } 
/>

    </Routes>
  </BrowserRouter>
);
}

export default App
