export const Button = ({ 
  onClick, 
  children, 
  className = "btn-primary",
  type = "button", 
  style = {}, 
  disabled = false,
  ...rest
}: any) => (
  <button 
  {...rest}
    type={type} 
    onClick={onClick} 
    className={`btn ${className}`} 
    style={style}
    disabled={disabled}
  >
    {children}
  </button>
);