import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import {usePosts} from '../hooks/usePosts'
import {useAuth} from '../hooks/useAuth'
import {UsersList} from '../components/Dashboard/UserList'
import {PostForm} from '../components/Dashboard/PostForm'
import {PostList} from '../components/Dashboard/PostList'
import {DraftList} from '../components/Dashboard/DraftList'
interface DashboardProps {
  post:ReturnType<typeof usePosts>
  auth:ReturnType<typeof useAuth>
}

export const Dashboard = ({auth,post}: DashboardProps) => {
  return (
    <section id="center">
      {/* HERO SEKCIJA */}
      <div className="hero">
        <h1>Dashboard</h1>
        {auth.profile && (
          <Card style={{ background: 'rgba(255,255,255,0.1)', marginTop: '10px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <p style={{ margin: 0 }}>Ulogovan kao: <strong>{auth.profile.email}</strong></p>
            <p style={{ margin: 0 }}>Uloga: <span style={{ color: '#ffa500', fontWeight: 'bold' }}>{auth.profile.role}</span></p>
          </Card>
        )}
      </div>

      <div className="dashboard-view">
        {auth.message && <p className="status-message success">{auth.message}</p>}
        
        <Button variant="danger" onClick={auth.handleLogout} style={{ marginBottom: '20px' }}>
          Odjavi se
        </Button>

        {/* LISTA KORISNIKA */}
       <UsersList users={auth.users}/>

        {/* FORMA ZA NOVI POST */}
       <PostForm 
        onSubmit={post.handleCreatePost}
        title={post.newPostTitle}
        setTitle={post.setNewPostTitle}
        content={post.newPostContent}
        setContent={post.setNewPostContent}
        />
        <PostList posts={post.posts}/>
        <DraftList drafts={post.drafts} onPublish={post.publishPost}/>

       
      </div>
    </section>
  );
};