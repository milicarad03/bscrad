import { useState } from 'react';
import heroImg from '../assets/hero.png';
import { useAuth } from '../hooks/useAuth';
import { Form } from '../components/UI/Form';
interface AuthPageProps {
  auth: ReturnType<typeof useAuth>;
}

export const AuthPage = ({ auth }: AuthPageProps) => {

  const [isLogin, setIsLogin] = useState(true);

  const loginFileds=[
    {type :"email", label: "Email", placeholder :"Email", value : auth.email,  onChange :auth.setEmail, required : true},
    {type :"password", label : "Password", placeholder :"Password", value : auth.password,  onChange :auth.setPassword, required : true}

  ];

  const registerFileds=[
    {type :"name", label : "Name", placeholder :"Name", value : auth.regName,  onChange :auth.setRegName, required : true},
    {type :"email", label :" Email" , placeholder :"Email", value : auth.regEmail,  onChange :auth.setRegEmail, required : true},
    {type :"password",label: "Password" ,placeholder :"Password", value : auth.regPassword,  onChange :auth.setRegPassword, required : true}

  ];


  return (
    <section id="center">
      <div className="hero">
        <img src={heroImg} className="base" width="120" height="129" alt="Hero" />
        <h1>{isLogin ? "Welcome back" : "Create account"}</h1>
      </div>

      <div className="auth-container">
        <Form
          title={isLogin ? "Login" : "Register"}
          submitLabel ={isLogin ? "Login" : "Create an account"}
          onSubmit={isLogin ? auth.handleLogin :auth.handleRegister}
          loading={auth.loading}
          message={isLogin? auth.message  : auth. regMessage}
          fields={isLogin? loginFileds : registerFileds}

        />
          {/* Switcher dugme */}
          <div className="auth-switch">
            <p>
              {isLogin ? "Sign in" : "Do you already have an account?"}
              <button onClick={() => {
                auth.setMessage(''); 
                auth.setRegMessage('');
                setIsLogin(!isLogin)}}>
                {isLogin ? "Register" : "Login"}
              </button>
            </p>
          </div>
      </div>
    </section>
  );
};