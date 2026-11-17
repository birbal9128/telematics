import Dashboard from "./components/dashboard/dashboard";

export const paths = {
  dashboard: '/dashboard',
  auth: { signIn: '/auth/sign-in', signUp: '/auth/sign-up', resetPassword: '/auth/reset-password' },
  errors: { 
    notAuthorize: '/errors/notAuthorize/',
    notFound: '/errors/notFound',
   },
} as const;
