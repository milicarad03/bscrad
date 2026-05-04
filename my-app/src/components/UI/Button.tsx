export const Button = ({ 
  onClick, 
  children, 
  className = "btn-primary",
  type = "button", 
  style = {}, 
  disabled = false 
}: any) => (
  <button 
    type={type} 
    onClick={onClick} 
    className={`btn ${className}`} 
    style={style}
    disabled={disabled}
  >
    {children}
  </button>
);