import {useState} from 'react';
import type {UserDTO,LoginDTO} from '../models/auth.dto'
import {ENDPOINTS} from '../api/config'
import { apiClient } from '../api/client';
import { toast } from 'react-hot-toast';
import log from 'loglevel';
const logger = log.getLogger('useAuth');
if (import.meta.env.DEV) {
  logger.setLevel('debug');
} else {
  logger.setLevel('warn');
}
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
      logger.error("[AUTH] Failed to fetch user profile matrix:", err.message);
      if (err.message.includes('401')) {
          logger.warn("[AUTH] Token expired or invalid. Triggering automatic session destruction.");
          handleLogout();
        }
        toast.error(err.message);
    })
  };

  const fetchUsers = async () => {
    if (!token) {
      logger.warn("[AUTH] Execution dropped for fetchUsers. Token missing from sessionStorage.");
      setUsers([]);
      return;
    }
    apiClient<UserDTO[]>(ENDPOINTS.AUTH.ALL_USERS,'GET', null, token)
     .then((data) => {
       setUsers(data.slice().reverse());
      })
     .catch ((err:any) =>{
      logger.error("[AUTH] Error building administrative user registry array:", err.message);
      if (err.message.includes('401')) {
          logger.warn("[AUTH] Unauthorized registry request. Dropping session context.");
          handleLogout();
        }
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
        logger.info(`[AUTH] Client successfully authenticated. Identity payload bound to: ${data.user.email}`);
        setMessage(`Login successful, welcome ${data.user.name || data.user.email}`);
      
        sessionStorage.setItem('userEmail', data.user.email);
        sessionStorage.setItem('token', data.accessToken);
        
        setToken(data.accessToken);
        setIsLoggedIn(true);
        setProfile(data.user);
      })
      .catch((err: any) => {
        logger.error("[AUTH] Authentication handshake failed:", err.message);
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
      logger.info(`[AUTH] Account creation pipeline finished for email signature: ${data.email}`);
      setRegMessage(`Registration successful, ${data.name}! You will be able to login once an administrator approves your account.`);
      setRegName('');
      setRegEmail('');
      setRegPassword('');
    })
    .catch ((err:any) =>{
     logger.error("[AUTH] Registration dispatch rejected:", err.message);
        setRegMessage(err.message || 'Invalid data');
      })
    .finally(() => {
        setLoading(false);
      });
  };


  const handleLogout = () => {
    logger.info("[AUTH] Clearing application security state and local storage frames.");
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
    logger.warn(`[AUTH] Dispatched network command to purge user record identifier: ${id}`);
    apiClient(ENDPOINTS.AUTH.DELETE_USER(Number(id)), 'DELETE', null, token)
        .then(() => {
          logger.info(`[AUTH] Successfully deleted user record identity [${id}] from central system.`);
            toast.success("User deleted");
            setUsers(prev => prev.filter(u => u.id !== id));
        })
        .catch((err) => {
        logger.error(`[AUTH] Data table optimization failed for user deletion [${id}]:`, err.message);
        toast.error(err.message);
      });
  };

  const handleApproveUser = (id: number | string, status : 'APPROVED' | 'REJECTED') => {
    logger.info(`[AUTH] Dispatching administrative decision update for identity: ${id}. Intended action: ${status}`);
    apiClient(ENDPOINTS.AUTH.APPROVE_USER(+id), 'PATCH', {status}, token)
        .then(() => {
          const action = status === 'APPROVED'? 'approved': 'rejected';
          logger.info(`[AUTH] User record identity [${id}] status set to: ${status}`);
            toast.success(`User ${ action }`);
            if(status === 'REJECTED'){
              setUsers(prev => prev.filter(u => u.id !== id));
              handleDeleteUser(id)
            }
            setUsers((prevUsers) => prevUsers.map((user) => user.id === id ? { ...user, status: status } : user));
        })
        .catch((err) => {
        logger.error(`[AUTH] Administrative review transaction failed for user payload [${id}]:`, err.message);
        toast.error(err.message);
      });
  };
  
 

  return {
    token, isLoggedIn, profile, users,
    email, setEmail, password, setPassword, message,
    regName, setRegName, regEmail, setRegEmail, regPassword, setRegPassword, regMessage,
    handleLogin, handleRegister, handleLogout, fetchProfile, fetchUsers, loading, handleDeleteUser, setMessage, setRegMessage, handleApproveUser
  };

  
};