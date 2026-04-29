interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Card = ({ title, children, style }: CardProps) => {
  return (
    <div className="card" style={style}>
      {title && <h2>{title}</h2>}
      {children}
    </div>
  );
};