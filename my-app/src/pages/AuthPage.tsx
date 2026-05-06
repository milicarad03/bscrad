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
                placeholder="Password" 
                value={auth.password}
                onChange={auth.setPassword}
                required 
              />
              <Button type="submit" className="btn-login" disabled={auth.loading}>
                {auth.loading ? "Loading. .." : "Login"}
              </Button>
              {auth.message && <p className={`status-message ${auth.message.includes('Uspešan') ? 'success' : 'warning'}`}>{auth.message}</p>}
            </form>
          ) : (
            /* --- REGISTRACIJA FORMA --- */
            <form onSubmit={auth.handleRegister} className="auth-form">
              <Input 
                placeholder="Name" 
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
                placeholder="Password" 
                value={auth.regPassword}
                onChange={auth.setRegPassword}
                required 
              />
              <Button type="submit" className="btn-register" disabled={auth.loading}>
                {auth.loading ? "Loading..." : "Create account"}
              </Button>
              {auth.regMessage && <p className={`status-message ${auth.regMessage.includes('Uspešan') ? 'success' : 'warning'}`}>{auth.regMessage}</p>}
            </form>
          )}

          {/* Switcher dugme */}
          <div className="auth-switch">
            <p>
              {isLogin ? "Sign in" : "Do you already have an account?"}
              <button onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Register" : "Login"}
              </button>
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};