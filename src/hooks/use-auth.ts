import { useAppData } from "@/components/providers/app-data-provider";

export function useAuth() {
  const {
    currentUser,
    login: appLogin,
    logout,
    registerOwner,
    requestForgotPassword: appRequestForgot,
    resetPassword: appResetPassword,
  } = useAppData();

  const login = async (identifier: string, password: string) => {
    return appLogin({ identifier, password });
  };

  const requestForgotPassword = async (email: string) => {
    return appRequestForgot(email);
  };

  const resetPassword = async (token: string, newPassword: string) => {
    return appResetPassword({ token, newPassword });
  };

  return {
    currentUser,
    isLoading: false,
    login,
    logout,
    registerOwner,
    requestForgotPassword,
    resetPassword,
    refreshUser: async () => {},
  };
}
