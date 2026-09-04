import { Card } from '../UI/Card';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';

interface PostFormProps {
  onSubmit: (e: React.SyntheticEvent) => void;
  title: string;
  setTitle: (val: string) => void;
  content: string;
  setContent: (val: string) => void;
  message:string;
}

export const PostForm = ({ onSubmit, title, setTitle, content, setContent, message }: PostFormProps) => (
  <Card title="Novi Post">
    <form onSubmit={onSubmit} className="auth-form">
      <Input 
        placeholder="Naslov posta" 
        value={title}
        onChange={setTitle}
        required
      />
      <Input 
        placeholder="Sadržaj posta..." 
        value={content}
        onChange={setContent}
        isTextArea
        required
      />
      <Button type="submit">Objavi post</Button>
      {message && <p className={`status-message ${message.includes('Uspešan') ? 'success' : 'warning'}`}>{message}</p>}
    </form>
  </Card>
);