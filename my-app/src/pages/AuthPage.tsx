import { useState } from 'react';
import heroImg from '../assets/hero.png';
import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { useAuth } from '../hooks/useAuth';

interface AuthPageProps {
  auth: ReturnType<typeof useAuth>;
}

export const AuthPage = ({ auth }: AuthPageProps) => {
  // Stanje koje prati koja je forma aktivna
  const [isLogin, setIsLogin] = useState(true);

  return (
    <section id="center">
      <div className="hero">
        <img src={heroImg} className="base" width="120" height="129" alt="Hero" />
        <h1>{isLogin ? "Welcome back" : "Create account"}</h1>
      </div>

      <div className="auth-container">
        <Card title={isLogin ? "Login" : "Register"}>
          {isLogin ? (
            /* --- LOGIN FORMA --- */
            <form onSubmit={auth.handleLogin} className="auth-form">
              <Input 
                type="email" 
                placeholder="Email" 
                value={auth.email}
                onChange={auth.setEmail}
                required 
              />
              <Input 
                type="password" 
                placeholder="Šifra" 
                value={auth.password}
                onChange={auth.setPassword}
                required 
              />
              <Button type="submit" className="btn-login" disabled={auth.loading}>
                {auth.loading ? "Učitavanje..." : "Prijavi se"}
              </Button>
              {auth.message && <p className={`status-message ${auth.message.includes('Uspešan') ? 'success' : 'warning'}`}>{auth.message}</p>}
            </form>
          ) : (
            /* --- REGISTRACIJA FORMA --- */
            <form onSubmit={auth.handleRegister} className="auth-form">
              <Input 
                placeholder="Ime" 
                value={auth.regName}
                onChange={auth.setRegName}
                required 
              />
              <Input 
                type="email" 
                placeholder="Email" 
                value={auth.regEmail}
                onChange={auth.setRegEmail}
                required 
              />
              <Input 
                type="password" 
                placeholder="Šifra" 
                value={auth.regPassword}
                onChange={auth.setRegPassword}
                required 
              />
              <Button type="submit" className="btn-register" disabled={auth.loading}>
                {auth.loading ? "Učitavanje..." : "Napravi nalog"}
              </Button>
              {auth.regMessage && <p className={`status-message ${auth.regMessage.includes('Uspešan') ? 'success' : 'warning'}`}>{auth.regMessage}</p>}
            </form>
          )}

          {/* Switcher dugme */}
          <div className="auth-switch">
            <p>
              {isLogin ? "Nemate nalog?" : "Već imate nalog?"}
              <button onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Registrujte se" : "Prijavite se"}
              </button>
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};