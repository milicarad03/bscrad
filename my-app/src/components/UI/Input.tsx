interface InputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  isTextArea?: boolean;
  required?: boolean;
}

export const Input = ({ value, onChange, placeholder, type = "text", isTextArea = false, required = false }: InputProps) => {
  const className = "custom-input";
  
  if (isTextArea) {
    return (
      <textarea
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
      className={className}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    />
  );
};