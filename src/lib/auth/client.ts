'use client';

import type { User } from '@/types/user';
import apiClient from './apiClient';
import axios from 'axios';

function generateToken(): string {
  const arr = new Uint8Array(12);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, (v) => v.toString(16).padStart(2, '0')).join('');
}

// const user = {
//   id: 'USR-000',
//   avatar: '/assets/avatar.png',
//   firstName: 'Sofia',
//   lastName: 'Rivers',
//   email: 'sofia@devias.io',
// } satisfies User;

export interface SignUpParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  ein: string,
  role: string
}

export interface SignInWithOAuthParams {
  provider: 'google' | 'discord';
}

export interface SignInWithPasswordParams {
  email: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

class AuthClient {
  async signUp(params: SignUpParams): Promise<{ error?: string }> {
    const { firstName, lastName, ein, role, password, email } = params;
    // console.log(firstName, lastName, ein, role, password, email)

    try {
      // Make API request
      const res = await axios.post('https://fdcserver.escortskubota.com/telematicsauth/register', {
        email: email,
        ein: ein,
        role: role,
        first_name: firstName,
        last_name: lastName,
        password: password,
      });

      if (res?.data?.success) {
        return {};  // Successful sign up, no error
      } else {
        return { error: res?.data?.message };  // Handle sign-up failure
      }
    } catch (err) {
      console.error('Error during sign-up:', err);  // Log the error for debugging
      return { error: 'An error occurred during sign up. Please try again.' };  // Provide user-friendly error
    }
  }

  async signInWithOAuth(_: SignInWithOAuthParams): Promise<{ error?: string }> {
    return { error: 'Social authentication not implemented' };
  }

  async signInWithPassword(params: SignInWithPasswordParams): Promise<{  error?: string }> {
    const { email, password } = params;
    try {
      const res = await apiClient.post('https://fdcserver.escortskubota.com/telematicsauth/login', {
        email, password
      },{withCredentials:true});
      // console.log(res);
      if (res?.data?.success) {
        const { token, role } = res?.data;
        localStorage.removeItem("TractorToken");
        // localStorage.removeItem("role");
        localStorage.setItem("TractorToken", token)
        // localStorage.setItem("role", role)
        return {};
      }
      else
        return { error: "Login failed, check credentials" }
    }
    catch (err) {
      console.log(err);
      return { error: "Login failed" }
    }
  }

  async resetPassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Password reset not implemented' };
  }
  
  async updatePassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Update reset not implemented' };
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    // We do not handle the API, so just check if we have a token in localStorage.
    try {
      const token = localStorage.getItem('TractorToken');
      if (!token) {
        return { data: null };
      }
      // Make API request
      const res = await apiClient.post(`https://fdcserver.escortskubota.com/telematicsauth/authenticate`,{
        token
      })
      // console.log(res)
      return { data: res?.data?.data?.at(0) };
    }
    catch (err) {
      return {}
    }
  }

  async signOut(): Promise<{ error?: string }> {
    localStorage.removeItem('TractorToken');

    return {};
  }
}

export const authClient = new AuthClient();