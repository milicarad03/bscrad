export interface UserDTO{
    id:number | string;
    email:string;
    name?:string;
    role:string;
    status:string;
}

export interface LoginDTO{
    accessToken:string;
    user:UserDTO;
    message?:string
}