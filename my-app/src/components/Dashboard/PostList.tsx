// src/components/Dashboard/PostList.tsx
import { Card } from '../UI/Card';
import type { PostDTO } from '../../models/post.dto';

export const PostList = ({ posts }: { posts: PostDTO[] }) => (
  <Card title="Objavljeni Postovi">
    {posts.length === 0 && <p>Nema objavljenih postova.</p>}
    {posts.map((p) => (
      <div key={p.id} style={{ borderBottom: '1px solid #444', padding: '15px 0', textAlign: 'left' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#646cff' }}>{p.title}</h3>
        <p>{p.content}</p>
      </div>
    ))}
  </Card>
);