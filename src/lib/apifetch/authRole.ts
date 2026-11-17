'use client';
import axios from 'axios';
import { useRouter } from 'next/navigation'; // Using the correct import for Next.js 13 App Router
import { useEffect } from 'react';
import apiClient from '../auth/apiClient';

// Define the function that performs the authorization check
export const checkAdminAccess = async (): Promise<string | true> => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    return '/errors'; // Return the path for redirection if no token
  }

  try {
    const response = await apiClient.get('https://fdcserver.escortskubota.com/fdc/authenticate/roleAuth', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.message !== 'admin') {
      return '/errors/notAuthorize'; // Return the path for redirection if not admin
    } else {
      return true; // Return false if user is admin (no redirection needed)
    }
  } catch (error) {
    console.error('Authorization check failed:', error);
    return '/errors/notAuthorize'; // Return the path for redirection in case of error
  }
};