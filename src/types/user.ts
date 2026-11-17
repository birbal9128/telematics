export interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  ein?:string;
  role?:string;
  verfication_status:number;
  [key: string]: unknown;
}
