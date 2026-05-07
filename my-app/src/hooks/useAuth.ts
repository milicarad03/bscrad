import {useState} from 'react';
import type {UserDTO,LoginDTO} from '../models/auth.dto'
import {ENDPOINTS} from '../api/config'
import { apiClient } from '../api/client';
import { toast } from 'react-hot-toast';
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
  const [loading, setLoading] = useState(false);


  const fetchProfile = async () => {
    if (!token) return;
    apiClient<UserDTO>(ENDPOINTS.AUTH.PROFILE,'GET',null,token)
    .then((data) => {
      setProfile(data); 
    })
     .catch ((err:any) => {
      if(err.message.includes('401')) handleLogout();
      toast.error(err.message);
      console.error("Error fetching profile", err);
    })
  };

  const fetchUsers = async () => {
    if (!token) {
      console.log("No token , skipping fetch");
      setUsers([]);
      return;
    }
    apiClient<UserDTO[]>(ENDPOINTS.AUTH.ALL_USERS,'GET', null, token)
     .then((data) => {
       setUsers(data);
      })
     .catch ((err:any) =>{
      if(err.message.includes('401')) handleLogout();
      toast.error(err.message);
      setUsers([]);
    })
  };


  const handleLogin = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!email || !password) {
    setMessage("Email and password are required!"); 
    return;
  }

    setMessage('Sending login request..');
    setLoading(true);

    apiClient<LoginDTO>(ENDPOINTS.AUTH.LOGIN, 'POST', { email, password })
      .then((data) => {
        setMessage(`Login successful, welcome ${data.user.name || data.user.email}`);
      
        sessionStorage.setItem('userEmail', data.user.email);
        sessionStorage.setItem('token', data.accessToken);
        
        setToken(data.accessToken);
        setIsLoggedIn(true);
        setProfile(data.user);
      })
      .catch((err: any) => {
        console.error("Login error:", err);
        setMessage(err.message || 'Invalid data.');
      })
      
      .finally(() => {
        setLoading(false);
      });
};

  
  const handleRegister = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setRegMessage('Sending registration request..');
    setLoading(true);

   apiClient<UserDTO>(ENDPOINTS.AUTH.REGISTER, 'POST', { name:regName, email:regEmail, password:regPassword})
    .then((data)=>{
      setRegMessage(`Registration successful, ${data.name}! You can now login.`);
      setRegName('');
      setRegEmail('');
      setRegPassword('');
    })
    .catch ((err:any) =>{
     console.error("Registration error:", err);
        setRegMessage(err.message || 'Invalid data');
      })
    .finally(() => {
        setLoading(false);
      });
  };


  const handleLogout = () => {
    sessionStorage.clear();
    setIsLoggedIn(false)
    setUsers([]);
    setMessage('Logged out successfully'); 
    setEmail(''); 
    setPassword('');
    setToken(null);
    setProfile(null);
  };
  
  const handleDeleteUser = (id: number | string) => {
    apiClient(ENDPOINTS.AUTH.DELETE_USER(Number(id)), 'DELETE', null, token)
        .then(() => {
            toast.success("User deleted");
            setUsers(prev => prev.filter(u => u.id !== id));
        })
        .catch(err => toast.error(err.message));
};
 

  return {
    token, isLoggedIn, profile, users,
    email, setEmail, password, setPassword, message,
    regName, setRegName, regEmail, setRegEmail, regPassword, setRegPassword, regMessage,
    handleLogin, handleRegister, handleLogout, fetchProfile, fetchUsers, loading, handleDeleteUser, setMessage, setRegMessage
  };

  
};