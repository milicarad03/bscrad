import heroImg from '../assets/hero.png';
import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import {useAuth} from '../hooks/useAuth'

interface AuthPageProps {
  auth: ReturnType<typeof useAuth>;
}

export const AuthPage = ({auth}: AuthPageProps) => {
  return (
    <section id="center">
      <div className="hero">
        <img src={heroImg} className="base" width="170" height="179" alt="Hero" />
        <h1>Get started</h1>
      </div>

      <div className="auth-wrapper">
        {/* REGISTRACIJA */}
        <Card title="Register">
          <form onSubmit={auth.handleRegister} className="auth-form">
            <Input 
              placeholder="Ime" 
              value={auth.regName}
              onChange={auth.setRegName}
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
            <Button type="submit">Napravi nalog</Button>
            {auth.regMessage && <p className="status-message success">{auth.regMessage}</p>}
          </form>
        </Card>

        {/* LOGIN */}
        <Card title="Login">
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
            <Button type="submit">Prijavi se</Button>
            {auth.message && <p className="status-message warning">{auth.message}</p>}
          </form>
        </Card>
      </div>
    </section>
  );
};