import { useState } from 'react';

export const usePosts = (token: string | null) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const fetchPosts = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/post/feed", {
        method: "GET", 
        headers: {
          "Authorization": `Bearer ${token}`, 
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (err) {
      console.error("Greška pri dovlačenju postova:", err);
    }finally {
      setLoading(false);
    }
  };


  const fetchDrafts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/post/drafts", {
        method: "GET", 
        headers: {
          "Authorization": `Bearer ${token}` 
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDrafts(data);
      }
    } catch (err) {
      console.error("Greška:", err);
    }finally {
      setLoading(false);
    }

  };

  return { posts, drafts, fetchPosts, fetchDrafts, loading, error };
};