import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate ,useNavigate} from 'react-router-dom';

function App() {
  const [users, setUsers] = useState<any[]>([]);
  const [count, setCount] = useState(0)
  // State za login formu
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regMessage, setRegMessage] = useState('');
  // Proveravamo da li već imamo token u sesiji (da ostane ulogovan na F5)
  const [isLoggedIn, setIsLoggedIn] = useState(!!sessionStorage.getItem('token'));
  //const navigate = useNavigate();

  const [posts, setPosts] = useState<any[]>([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [drafts, setDrafts] = useState<any[]>([]);


  const handleCreatePost = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    
    // Uzimamo token (iz bilo kog storage-a)
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedEmail = sessionStorage.getItem('userEmail')
    // Ovde bi trebala da imaš state-ove za title i content (vidi korak 2)
    const postData = {
      title: newPostTitle,
      content: newPostContent,
      authorEmail: storedEmail // Email ulogovanog korisnika (već ga imaš u state-u)
    };

    try {
      const response = await fetch("http://localhost:3000/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Iako tvoj trenutni @Post("post") nema @UseGuards, 
          // dobra je praksa slati ga ako planiraš da zaključaš tu rutu
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        alert("Post uspešno kreiran!");
        fetchDrafts();
        setNewPostTitle(''); // Resetuj polja
        setNewPostContent('');
        // Možeš pozvati fetch da osvežiš listu postova ako je imaš
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
      const response = await fetch(`http://localhost:3000/publish/${id}`, {
        method: "PUT", // Tvoj backend koristi @Put za ovo
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert("Post je sada javan!");
        fetchPosts(); // Ponovo povuci postove da osvežiš listu
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
      const response = await fetch("http://localhost:3000/feed", {
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
    const email = sessionStorage.getItem('userEmail');
    if (!email) return;

    try {
      const response = await fetch(`http://localhost:3000/drafts/${email}`);
      if (response.ok) {
        const data = await response.json();
        setDrafts(data);
      }
    } catch (err) {
      console.error("Greška pri dovlačenju skica:", err);
    }
  };


  const fetchUsers = async () => {
    const token = sessionStorage.getItem('token');

    // Ako nemamo token, ne želimo ni da pokušavamo (opciono)
    if (!token) {
      console.log("Nema tokena, preskačem fetch.");
      setUsers([]);
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/users", {
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
    fetchUsers();
    fetchPosts();
    fetchDrafts();
    }
  }, [isLoggedIn]);
 

  // Funkcija za slanje login podataka
  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setMessage('Slanje...');

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

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
  //localStorage.removeItem('token'); // Brišemo ključ
  setIsLoggedIn(false)
  setUsers([]); // Praznimo listu korisnika
  setMessage('Odjavljeni ste.'); // Resetujemo poruku
  setEmail(''); // Opciono: brišemo polja forme
  setPassword('');
};

  //registracija
  const handleRegister = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setRegMessage('Registracija u toku...');

    try {
      const response = await fetch("http://localhost:3000/user", {
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
            <section id="center">
              <div className="hero">
                <img src={heroImg} className="base" width="170" height="179" alt="" />
                <h1>Get started</h1>
              </div>
              <div className="auth-wrapper">
                {/* Ovde ubaci ceo svoj div sa Register i Login karticama */}
                <div className="auth-card">
                  <h2>Register</h2>
                  <form onSubmit={handleRegister} className="auth-form">
                    <input 
                    className="custom-input"
                    placeholder="Ime" 
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                  />
                  <input 
                    className="custom-input"
                    type="email" 
                    placeholder="Email" 
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required 
                  />
                  <input 
                    className="custom-input"
                    type="password" 
                    placeholder="Šifra" 
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required 
                  />
                    <button type="submit" className="btn-auth btn-register">Napravi nalog</button>
                    {regMessage && <p className="status-message success">{regMessage}</p>}
                  </form>
                </div>

                <div className="auth-card">
                  <h2>Login</h2>
                  <form onSubmit={handleLogin} className="auth-form">
                   <input 
                    className="custom-input"
                    type="email" 
                    placeholder="Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                  <input 
                    className="custom-input"
                    type="password" 
                    placeholder="Šifra" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                    <button type="submit" className="btn-auth btn-login">Prijavi se</button>
                    {message && <p className="status-message warning">{message}</p>}
                  </form>
                </div>
              </div>
            </section>
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
            <section id="center">
              <div className="hero">
                <img src={heroImg} className="base" width="170" height="179" alt="" />
                <h1>Dashboard</h1>
              </div>
              
              <div className="dashboard-view">
                {message && <p className="status-message success">{message}</p>}
                <button onClick={handleLogout} className="btn-auth" style={{backgroundColor: '#ff4444', marginBottom: '20px'}}>
                  Odjavi se
                </button>

                <div className="card">
                  <h2>Users from backend:</h2>
                  <div style={{ textAlign: 'left' }}>
                    {users.map((user) => (
                      <p key={user.id} style={{ borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                        <strong>{user.name}</strong> <br />
                        <span style={{ opacity: 0.7 }}>{user.email}</span>
                      </p>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <h2>Novi Post</h2>
                  <form onSubmit={handleCreatePost} className="auth-form">
                    <input 
                      className="custom-input"
                      placeholder="Naslov posta" 
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      required
                    />
                    <textarea 
                      className="custom-input"
                      placeholder="Sadržaj posta..." 
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      style={{ minHeight: '100px' }}
                    />
                    <button type="submit" className="btn-auth">Objavi post</button>
                  </form>
                </div>
                <div className="card">
                <h2>Tvoji Postovi</h2>
                {posts.map((post) => (
                  <div key={post.id} style={{ borderBottom: '1px solid #444', padding: '10px 0' }}>
                    <h3>{post.title}</h3>
                    <p>{post.content}</p>
                    
                    {/* Ako post nije objavljen, prikaži dugme za objavu */}
                    {!post.published && (
                      <button 
                        onClick={() => publishPost(post.id)} 
                        className="btn-auth" 
                        style={{ padding: '5px 10px', fontSize: '12px', background: '#4CAF50' }}
                      >
                        Objavi (Publish)
                      </button>
                    )}
                    
                    
                  </div>
              ))}
            </div>
                <div className="card" style={{ borderLeft: '5px solid #ffa500' }}>
                    <h2>Moje skice (Drafts)</h2>
                    {drafts.length === 0 && <p>Nemaš sačuvanih skica.</p>}
                    {drafts.map((draft) => (
                      <div key={draft.id} className="draft-item">
                        <h3>{draft.title}</h3>
                        <button 
                          onClick={() => publishPost(draft.id)} 
                          className="btn-auth" 
                          style={{ background: '#4CAF50' }}
                        >
                          🚀 Obavi sada
                        </button>
                      </div>
                    ))}
                  </div>
              </div>
            </section>
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
