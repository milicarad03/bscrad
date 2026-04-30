import {useState} from 'react';
import type {UserDTO,LoginDTO} from '../models/auth.dto'
import {ENDPOINTS} from '../api/config'
import { apiClient } from '../api/client';

export const useAuth = () => {

  const [token, setToken] = useState<string | null>(sessionStorage.getItem('token'));
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [profile, setProfile] = useState<UserDTO| null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regMessage, setRegMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(!!sessionStorage.getItem('token'));


  const fetchProfile = async () => {
    if (!token) return;
    try {
      const data= await apiClient<UserDTO>(ENDPOINTS.AUTH.PROFILE,'GET',null,token);
      setProfile(data); 
    } catch (err:any) {
      if(err.message.includes('401')) handleLogout();
      console.error("Greška pri dovlačenju profila:", err);
      setMessage(err.message);
    }
  };

  const fetchUsers = async () => {
    if (!token) {
      console.log("Nema tokena, preskačem fetch.");
      setUsers([]);
      return;
    }
    try {
      const data= await apiClient<UserDTO[]>(ENDPOINTS.AUTH.ALL_USERS,'GET', null, token);
      setUsers(data);
    } catch (err:any) {
      if(err.message.includes('401')) handleLogout();
      console.error(err.message);
      setMessage(err.message);
      setUsers([]);
    }
  };

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setMessage('Slanje...');
    
    try {
      const data = await apiClient<LoginDTO>(ENDPOINTS.AUTH.LOGIN,'POST', {email,password});

        setMessage(`Uspešan login! Dobrodošli, ${data.user.name || data.user.email}`);
        sessionStorage.setItem('userEmail', data.user.email);
        sessionStorage.setItem('token', data.accessToken);
        setToken(data.accessToken);
        setIsLoggedIn(true);
        setProfile(data.user);
        console.log("Token sačuvan:", data.accessToken);
    
    } catch (err:any) {
      setMessage(err.message);
    }
  };

  const handleRegister = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setRegMessage('Registracija u toku...');

    try {
      const data = await apiClient<UserDTO>(ENDPOINTS.AUTH.REGISTER, 'POST', { name:regName, email:regEmail, password:regPassword});
      setRegMessage(`Uspešno ste se registrovali, ${data.name}! Sada se možete prijaviti.`);
      setRegName('');
      setRegEmail('');
      setRegPassword('');
    } catch (err:any) {
      setRegMessage(err.message);
    }
  };


  const handleLogout = () => {
    sessionStorage.clear();
    setIsLoggedIn(false)
    setUsers([]);
    setMessage('Odjavljeni ste.'); 
    setEmail(''); 
    setPassword('');
    setToken(null);
    setProfile(null);
  };

  return {
    token, isLoggedIn, profile, users,
    email, setEmail, password, setPassword, message,
    regName, setRegName, regEmail, setRegEmail, regPassword, setRegPassword, regMessage,
    handleLogin, handleRegister, handleLogout, fetchProfile, fetchUsers
  };

  
};