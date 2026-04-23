import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

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

  useEffect(() => {
    fetch("http://localhost:3000/users")
      .then((res) => {
      if (!res.ok) throw new Error("Greška na serveru");
      return res.json();
    })
    .then((data) => {
      console.log("Podaci sa backenda:", data); // Proveri ovo u F12 konzoli!
      setUsers(data);
    })
    .catch((err) => console.error("Greška pri fetch-u:", err));
  }, []);

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

      if (response.ok && !data.message) {
        setMessage(`Uspešan login! Dobrodošli, ${data.name || data.email}`);
      } else {
        setMessage(data.message || "Greška pri prijavi");
      }
    } catch (error) {
      setMessage("Server nije dostupan");
    }
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
        fetch("http://localhost:3000/users").then(res => res.json()).then(setUsers);
      } else {
        setRegMessage(data.message || "Greška pri registraciji. Proverite da li email već postoji.");
      }
    } catch (error) {
      setRegMessage("Server nije dostupan");
    }
  };



  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
            
           {/* AUTH SEKCIJA: REGISTER & LOGIN JEDNO PORED DRUGOG */}
        <div className="auth-wrapper">
          
          {/* REGISTER KARTICA */}
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

          {/* LOGIN KARTICA */}
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

          {/* LISTA KORISNIKA */}
          <div className="card">
            <h2>Users from backend:</h2>
            <div style={{ textAlign: 'left' }}>
              {users.length === 0 ? <p>Nema korisnika...</p> : 
                users.map((user) => (
                  <p key={user.id} style={{ borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                    <strong>{user.name || "Bez imena"}</strong> <br />
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{user.email}</span>
                  </p>
                ))
              }
            </div>
          </div>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
