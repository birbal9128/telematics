import axios from 'axios';
// Create an Axios instance
const apiClient = axios.create({
  baseURL: 'https://fdcserver.escortskubota.com',
  // timeout: 10000,
});

// Request interceptor to attach the token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('TractorToken'); // or wherever you're storing the token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry and refresh the token
apiClient.interceptors.response.use(
  (response) => response, // If request is successful, return the response
  async (error) => {
    console.log(error);
    const originalRequest = error.config;

    // Check if it's a 401 Unauthorized error
    if (!error.response.data.success && error.response.data.error === "You're not authorized.") {
      originalRequest._retry = true;
      // console.log("I am running");
      // Call the refresh token route to get a new access token
      try {
        // const refreshToken = localStorage.getItem('refreshToken'); // Assume refresh token is also stored
        const response = await axios.post(`https://fdcserver.escortskubota.com/telematicsauth/refresh-token`, {},{withCredentials:true});
        // console.log(response);
        // If refresh is successful, update the access token
        const accessToken = response.data.token;
        // console.log(accessToken);
        localStorage.setItem('TractorToken', accessToken); // Update the access token in storage

        // Retry the original request with the new access token
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return apiClient(originalRequest); // Retry original request
      } catch (refreshError) {
        // Handle refresh token failure (redirect to login, etc.)
        console.error('Refresh token failed:', refreshError);
      }
    }

    // If error is not due to expired token, reject as usual
    return Promise.reject(error);
  }
);

export default apiClient;