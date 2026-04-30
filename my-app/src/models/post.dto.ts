export interface PostDTO{
    id:number;
    title:string;
    content:string;
    published:boolean;
    createdAt:string;
}

export interface CreatePostDTO {
  title: string;
  content: string;
}