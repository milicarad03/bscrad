import { useState } from 'react';
import type {PostDTO} from '../models/post.dto'
import type {CreatePostDTO} from '../models/post.dto'
import {ENDPOINTS} from '../api/config.ts'
import {apiClient} from '../api/client.ts'
import { toast } from 'react-hot-toast';
export const usePosts = (token: string | null) => {
  // 1. STANJA (State)
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [drafts, setDrafts] = useState<PostDTO[]>([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [myPosts, setMyPosts] = useState<PostDTO[]>([]);
  const [message, setMessage] = useState('');


  const fetchPosts = async () => {
   if (!token) return;
   apiClient<PostDTO[]>(ENDPOINTS.POSTS.FEED, 'GET', null, token)
     .then((data) =>{
      setPosts(data.slice().reverse());
    })
     .catch ((err:any) => { 
      console.error(err); 
      toast.error(err);
     
    })
  };

  const fetchDrafts = async () => {
    if (!token) return;
    apiClient<PostDTO[]>(ENDPOINTS.POSTS.DRAFTS, 'GET',  null, token)
    .then((data) => {
      setDrafts(data);
    })
     .catch ((err:any) => {
      console.error(err); 
      toast.error(err);
    })
  };

 
 const handleCreatePost = (e: React.SyntheticEvent) => {
  if (!token) return;
  e.preventDefault();

  const dataCreatePost: CreatePostDTO = {
    title: newPostTitle,
    content: newPostContent
  };

  apiClient<PostDTO>(ENDPOINTS.POSTS.CREATE, 'POST', dataCreatePost, token)
    .then((newPostFromServer) => {
   
      setDrafts((prevPosts) => [newPostFromServer, ...prevPosts]);
    
      setMessage(`Post "${newPostFromServer.title}" created successfully!`);
      setNewPostTitle('');
      setNewPostContent('');
    })
    .catch((err: any) => {
      console.error(err);
      toast.error(err.message || "Error creating post");
    });
};
  
  const publishPost = async (id: number) => {
    if (!token) return;
    apiClient<PostDTO>(ENDPOINTS.POSTS.PUBLISH(id), 'PUT', null,token)
    .then((data) => {
      setPosts((prevPosts) => [data, ...prevPosts]);
      toast.success("Post published!");
      setDrafts((prevDrafts) => prevDrafts.filter(draft => draft.id !== id));
    }) 
    .catch ((err:any) => { 
      console.error(err); 
      toast.error(err);
    })
  };

  const fetchMyPosts = async () => {
    if (!token) return;
    apiClient<PostDTO[]>(ENDPOINTS.POSTS.MYPOSTS, 'GET', null, token)
    .then((data) => {
      setMyPosts(data);
    })
    .catch ((err:any) => {
      console.error("Error:", err);
      toast.error(err);
    })
  };

  
  return { 
    posts, drafts,myPosts, newPostTitle, setNewPostTitle, 
    newPostContent, setNewPostContent, setMyPosts,
    fetchPosts, fetchDrafts, fetchMyPosts, handleCreatePost, publishPost, loading, message
  };
};