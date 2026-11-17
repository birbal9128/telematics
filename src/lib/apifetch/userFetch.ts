import axios from 'axios';
import apiClient from '../auth/apiClient';

export const fetchUserFromId=async(id:string)=>{
    const authToken=localStorage.getItem('authToken')
    const res=await apiClient.get(`https://fdcserver.escortskubota.com/fdc/user/${id}`,{
        headers:{
          'Authorization':`bearer ${authToken}`
        }
      });
      console.log(res);
    return res?.data?.data?.at(0);
}