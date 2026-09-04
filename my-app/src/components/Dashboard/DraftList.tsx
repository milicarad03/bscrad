import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import type { PostDTO } from '../../models/post.dto';

interface DraftListProps {
  drafts: PostDTO[];
  onPublish: (id: number) => void;
}

export const DraftList = ({ drafts, onPublish }: DraftListProps) => (
  <Card title="Moje skice (Drafts)" style={{ borderLeft: '5px solid #ffa500' }}>
    {drafts.length === 0 && <p>Nemaš sačuvanih skica.</p>}
    {drafts.map((draft) => (
      <div key={draft.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', padding: '10px 0' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{draft.title}</h3>
        <Button 
          variant="success" 
          onClick={() => onPublish(draft.id)}
          style={{ padding: '5px 15px', fontSize: '14px' }}
        >
          🚀 Objavi sada
        </Button>
      </div>
    ))}
  </Card>
);