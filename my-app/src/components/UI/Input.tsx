interface InputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  label?:string
  isTextArea?: boolean;
  required?: boolean;
  [key: string]: any;
}

export const Input = ({ value, onChange, placeholder, type = "text", isTextArea = false, required = false, ...rest}: InputProps) => {
  const className = "custom-input";
  
  if (isTextArea) {
    return (
      <textarea
      {...rest}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ minHeight: '100px' }}
        required={required}
      />
    );
  }

  return (
    <input
    {...rest}
      className={className}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    />
  );
};