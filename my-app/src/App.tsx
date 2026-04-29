import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate ,useNavigate} from 'react-router-dom';
import { Dashboard } from './pages/Dashboard'
import {AuthPage} from './pages/AuthPage'
import {usePosts} from './hooks/usePosts'



function App() {
  const [users, setUsers] = useState<any[]>([]);
  const [count, setCount] = useState(0)
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regMessage, setRegMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(!!sessionStorage.getItem('token'));

  const [posts, setPosts] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [drafts, setDrafts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const token = sessionStorage.getItem('token');

  


  const fetchProfile = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch("http://localhost:3000/users/profile", { // Proveri putanju u NestJS
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data); // Ovde dobijaš { userId, email, role } iz validate() metode
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error("Greška pri dovlačenju profila:", err);
    }
  };
  const fetchMyPosts = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch("http://localhost:3000/post/my-posts", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyPosts(data);
      }
    } catch (err) {
      console.error("Greška:", err);
    }
  };


  const handleCreatePost = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedEmail = sessionStorage.getItem('userEmail')
    
    const postData = {
      title: newPostTitle,
      content: newPostContent,
     // authorEmail: storedEmail 
    };

    try {
      const response = await fetch("http://localhost:3000/post/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        alert("Post uspešno kreiran!");
        fetchDrafts();
        setNewPostTitle(''); // Resetuj polja
        setNewPostContent('');
        
      }else if (response.status === 401){
          // Ako dobijemo 401 Unauthorized, praznimo listu
          console.warn("Sesija je istekla.");
          handleLogout();
          return;
          //if (response.status === 401) localStorage.removeItem('token');
        }
    } catch (error) {
      console.error("Greška:", error);
    }
  };

  const publishPost = async (id: number) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:3000/post/publish/${id}`, {
        method: "PUT", 
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert("Post je sada javan!");
        fetchPosts();
        fetchDrafts(); 
      }
    } catch (err) {
      console.error("Greška pri objavljivanju:", err);
    }
  };

  const fetchPosts = async () => {
    // Prvo uzimamo token iz memorije (proveravamo oba storage-a)
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) return;

    try {
      const response = await fetch("http://localhost:3000/post/feed", {
        method: "GET", 
        headers: {
          "Authorization": `Bearer ${token}`, 
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else if (response.status === 401) {
        // Ako je token istekao dok smo tražili postove, izbacujemo korisnika
        handleLogout();
      }
    } catch (err) {
      console.error("Greška pri dovlačenju postova:", err);
    }
  };
 

  const fetchDrafts = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch("http://localhost:3000/post/drafts", {
        method: "GET", 
        headers: {
          "Authorization": `Bearer ${token}` 
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDrafts(data);
      }
    } catch (err) {
      console.error("Greška:", err);
    }
  };




  const fetchUsers = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.log("Nema tokena, preskačem fetch.");
      setUsers([]);
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/users/allusers", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else if (response.status === 401){
        // Ako dobijemo 401 Unauthorized, praznimo listu
        console.warn("Sesija je istekla.");
        handleLogout();
        return;
        //if (response.status === 401) localStorage.removeItem('token');
      }
    } catch (err) {
      console.error("Mrežna greška:", err);
      setUsers([]);
    }
  };


  useEffect(() => {
    if(isLoggedIn){
    fetchProfile();
    fetchUsers();
    fetchDrafts();
    fetchPosts();
    
    }
  }, [isLoggedIn]);
 

  // Funkcija za slanje login podataka
  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setMessage('Slanje...');

    try {
      const response = await fetch("http://localhost:3000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json();

      if (response.ok && data.accessToken) {
        setMessage(`Uspešan login! Dobrodošli, ${data.user.name || data.user.email}`);
        sessionStorage.setItem('userEmail', data.user.email);
        sessionStorage.setItem('token', data.accessToken)
        setIsLoggedIn(true);
        fetchUsers();
        
      } else {
        setMessage(data.message || "Greška pri prijavi");
      }
      console.log("Token sačuvan:", data.accessToken);
    } catch (error) {
      setMessage("Server nije dostupan");
    }
  };

  const handleLogout = () => {
  sessionStorage.removeItem('token');
  sessionStorage.clear();

  setIsLoggedIn(false)
  setUsers([]);
 // setDrafts([]); 
  setMessage('Odjavljeni ste.'); 
  setEmail(''); 
  setPassword('');
};

  //registracija
  const handleRegister = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setRegMessage('Registracija u toku...');

    try {
      const response = await fetch("http://localhost:3000/users/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: regName, 
          email: regEmail, 
          password: regPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRegMessage(`Uspešno ste se registrovali, ${data.name}! Sada se možete prijaviti.`);
        // Opciono: osveži listu korisnika odmah
        //fetch("http://localhost:3000/users").then(res => res.json()).then(setUsers);
      } else {
        setRegMessage(data.message || "Greška pri registraciji. Proverite da li email već postoji.");
      }
    } catch (error) {
      setRegMessage("Server nije dostupan");
    }
  };



  return (
  <BrowserRouter>
    <Routes>
      
      {/* RUTA 1: LOGIN I REGISTRACIJA */}
      <Route 
        path="/" 
        element={
          !isLoggedIn ? (
            <AuthPage 
                // Prosleđujemo sve što AuthPage traži
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                handleLogin={handleLogin} message={message}
                regName={regName} setRegName={setRegName}
                regEmail={regEmail} setRegEmail={setRegEmail}
                regPassword={regPassword} setRegPassword={setRegPassword}
                handleRegister={handleRegister} regMessage={regMessage}
              />
          ) : (
            <Navigate to="/dashboard" />
          )
        } 
      />

      {/* RUTA 2: DASHBOARD (LISTA KORISNIKA) */}
      <Route 
        path="/dashboard" 
        element={
          isLoggedIn ? (
            <Dashboard 
          // Podaci (State)
          profile={profile}
          users={users}
          posts={posts}
          drafts={drafts}
          message={message}
          newPostTitle={newPostTitle}
          newPostContent={newPostContent}
          
          // Funkcije za promenu state-a
          setNewPostTitle={setNewPostTitle}
          setNewPostContent={setNewPostContent}
          
          // Akcije (Handleri)
          handleLogout={handleLogout}
          handleCreatePost={handleCreatePost}
          publishPost={publishPost}
        />
          ) : (
            <Navigate to="/" />
          )
        } 
      />

    </Routes>
  </BrowserRouter>
);
}

export default App
