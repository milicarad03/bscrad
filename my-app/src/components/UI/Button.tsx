export const Button = ({ onClick, children, className = "", type = "button", style = {} }: any) => (
  <button 
    type={type} 
    onClick={onClick} 
    className={`btn-auth ${className}`} 
    style={style}
  >
    {children}
  </button>
);