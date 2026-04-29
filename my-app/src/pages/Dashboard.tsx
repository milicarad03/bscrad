import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';

interface DashboardProps {
  profile: any;
  users: any[];
  posts: any[];
  drafts: any[];
  message: string;
  newPostTitle: string;
  setNewPostTitle: (val: string) => void;
  newPostContent: string;
  setNewPostContent: (val: string) => void;
  handleLogout: () => void;
  handleCreatePost: (e: React.SyntheticEvent) => void;
  publishPost: (id: number) => void;
}

export const Dashboard = ({
  profile,
  users,
  posts,
  drafts,
  message,
  newPostTitle,
  setNewPostTitle,
  newPostContent,
  setNewPostContent,
  handleLogout,
  handleCreatePost,
  publishPost
}: DashboardProps) => {
  return (
    <section id="center">
      {/* HERO SEKCIJA */}
      <div className="hero">
        <h1>Dashboard</h1>
        {profile && (
          <Card style={{ background: 'rgba(255,255,255,0.1)', marginTop: '10px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <p style={{ margin: 0 }}>Ulogovan kao: <strong>{profile.email}</strong></p>
            <p style={{ margin: 0 }}>Uloga: <span style={{ color: '#ffa500', fontWeight: 'bold' }}>{profile.role}</span></p>
          </Card>
        )}
      </div>

      <div className="dashboard-view">
        {message && <p className="status-message success">{message}</p>}
        
        <Button variant="danger" onClick={handleLogout} style={{ marginBottom: '20px' }}>
          Odjavi se
        </Button>

        {/* LISTA KORISNIKA */}
        <Card title="Users from backend:">
          <div style={{ textAlign: 'left' }}>
            {users.map((user) => (
              <p key={user.id} style={{ borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                <strong>{user.name}</strong> <br />
                <span style={{ opacity: 0.7 }}>{user.email}</span>
              </p>
            ))}
          </div>
        </Card>

        {/* FORMA ZA NOVI POST */}
        <Card title="Novi Post">
          <form onSubmit={handleCreatePost} className="auth-form">
            <Input 
              placeholder="Naslov posta" 
              value={newPostTitle}
              onChange={setNewPostTitle}
              required
            />
            <Input 
              placeholder="Sadržaj posta..." 
              value={newPostContent}
              onChange={setNewPostContent}
              isTextArea
            />
            <Button type="submit">Objavi post</Button>
          </form>
        </Card>

        {/* FEED OBJAVLJENIH POSTOVA */}
        <Card title="Objavljeni Postovi">
          {posts.length === 0 && <p>Nema objavljenih postova.</p>}
          {posts.map((post) => (
            <div key={post.id} style={{ borderBottom: '1px solid #444', padding: '15px 0', textAlign: 'left' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#646cff' }}>{post.title}</h3>
              <p>{post.content}</p>
            </div>
          ))}
        </Card>

        {/* SKICE (DRAFTS) */}
        <Card title="Moje skice (Drafts)" style={{ borderLeft: '5px solid #ffa500' }}>
          {drafts.length === 0 && <p>Nemaš sačuvanih skica.</p>}
          {drafts.map((draft) => (
            <div key={draft.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', padding: '10px 0' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{draft.title}</h3>
              <Button 
                variant="success" 
                onClick={() => publishPost(draft.id)}
                style={{ padding: '5px 15px', fontSize: '14px' }}
              >
                🚀 Objavi sada
              </Button>
            </div>
          ))}
        </Card>
      </div>
    </section>
  );
};