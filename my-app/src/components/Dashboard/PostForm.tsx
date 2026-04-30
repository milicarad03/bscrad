// src/components/Dashboard/PostForm.tsx
import { Card } from '../UI/Card';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';

interface PostFormProps {
  onSubmit: (e: React.SyntheticEvent) => void;
  title: string;
  setTitle: (val: string) => void;
  content: string;
  setContent: (val: string) => void;
}

export const PostForm = ({ onSubmit, title, setTitle, content, setContent }: PostFormProps) => (
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
      />
      <Button type="submit">Objavi post</Button>
    </form>
  </Card>
);