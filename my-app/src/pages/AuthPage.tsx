import heroImg from '../assets/hero.png';
import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';

interface AuthPageProps {
  // Login props
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  handleLogin: (e: React.SyntheticEvent) => void;
  message: string;
  
  // Register props
  regName: string;
  setRegName: (val: string) => void;
  regEmail: string;
  setRegEmail: (val: string) => void;
  regPassword: string;
  setRegPassword: (val: string) => void;
  handleRegister: (e: React.SyntheticEvent) => void;
  regMessage: string;
}

export const AuthPage = ({
  email, setEmail, password, setPassword, handleLogin, message,
  regName, setRegName, regEmail, setRegEmail, regPassword, setRegPassword, handleRegister, regMessage
}: AuthPageProps) => {
  return (
    <section id="center">
      <div className="hero">
        <img src={heroImg} className="base" width="170" height="179" alt="Hero" />
        <h1>Get started</h1>
      </div>

      <div className="auth-wrapper">
        {/* REGISTRACIJA */}
        <Card title="Register">
          <form onSubmit={handleRegister} className="auth-form">
            <Input 
              placeholder="Ime" 
              value={regName}
              onChange={setRegName}
            />
            <Input 
              type="email" 
              placeholder="Email" 
              value={regEmail}
              onChange={setRegEmail}
              required 
            />
            <Input 
              type="password" 
              placeholder="Šifra" 
              value={regPassword}
              onChange={setRegPassword}
              required 
            />
            <Button type="submit">Napravi nalog</Button>
            {regMessage && <p className="status-message success">{regMessage}</p>}
          </form>
        </Card>

        {/* LOGIN */}
        <Card title="Login">
          <form onSubmit={handleLogin} className="auth-form">
            <Input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={setEmail}
              required 
            />
            <Input 
              type="password" 
              placeholder="Šifra" 
              value={password}
              onChange={setPassword}
              required 
            />
            <Button type="submit">Prijavi se</Button>
            {message && <p className="status-message warning">{message}</p>}
          </form>
        </Card>
      </div>
    </section>
  );
};