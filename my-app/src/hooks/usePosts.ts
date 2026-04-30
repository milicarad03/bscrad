import { useState } from 'react';
import type {PostDTO} from '../models/post.dto'
import type {CreatePostDTO} from '../models/post.dto'
import {ENDPOINTS} from '../api/config.ts'
import {apiClient} from '../api/client.ts'

export const usePosts = (token: string | null) => {
  // 1. STANJA (State)
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [drafts, setDrafts] = useState<PostDTO[]>([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [myPosts, setMyPosts] = useState<PostDTO[]>([]);
  const [message, setMessage] = useState('');

  // 2. FUNKCIJA ZA ČITANJE (GET)
  const fetchPosts = async () => {
   if (!token) return;
    try {
      const data= await apiClient<PostDTO[]>(ENDPOINTS.POSTS.FEED, 'GET', null, token);
      setPosts(data);
    } catch (err:any) { 
      console.error(err); 
      setMessage(err.message);
    }
  };

  const fetchDrafts = async () => {
    if (!token) return;
    try {
      const data = await apiClient<PostDTO[]>(ENDPOINTS.POSTS.DRAFTS, 'GET',  null, token);
      setDrafts(data);
    } catch (err:any) {
      console.error(err); 
      setMessage(err.message);
    }
  };

  // 3. FUNKCIJA ZA KREIRANJE (POST)
  const handleCreatePost = async (e: React.SyntheticEvent) => {
    if (!token) return;
    e.preventDefault();

    const dataCreatePost : CreatePostDTO = {
      title:newPostTitle,
      content:newPostContent
    };
    try {
      const data = await apiClient<PostDTO>(ENDPOINTS.POSTS.CREATE, 'POST', dataCreatePost, token);
     
      setMessage(`Post je uspesno kreiran!`);
      setNewPostTitle('');
      setNewPostContent('');
      fetchPosts(); 
      fetchDrafts();
      
    } catch (err:any) { 
      console.error(err); 
      setMessage(err.message);
    }
  };

  // 4. FUNKCIJA ZA PUBLIKOVANJE (PUT)
  const publishPost = async (id: number) => {
    if (!token) return;
    try {
      const res = await apiClient<PostDTO>(ENDPOINTS.POSTS.PUBLISH(id), 'PUT', null,token);
      alert("Post je sada javan!");
      fetchPosts();
      fetchDrafts();
      
    } catch (err:any) { 
      console.error(err); 
      setMessage(err.message);
    }
  };

  const fetchMyPosts = async () => {
    if (!token) return;

    try {
      const data= await apiClient<PostDTO[]>(ENDPOINTS.POSTS.MYPOSTS, 'GET', null, token);
      setMyPosts(data);

    } catch (err:any) {
      console.error("Greška:", err);
      setMessage(err.message);
    }
  };

  
  return { 
    posts, drafts,myPosts, newPostTitle, setNewPostTitle, 
    newPostContent, setNewPostContent, setMyPosts,
    fetchPosts, fetchDrafts, fetchMyPosts, handleCreatePost, publishPost, loading, message
  };
};