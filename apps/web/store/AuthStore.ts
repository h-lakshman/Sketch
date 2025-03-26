import axios from "axios";
import { create } from "zustand";

const getInitialAuthState = () => {
  if (typeof window !== "undefined") {
    return !!localStorage.getItem("token");
  }
  return false;
};
const removeLocalStorageData = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
  }
};

interface AuthStore {
  token: string | null;
  formData: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  };
  error: string;
  isAuthenticated: boolean;
  loading: boolean;
  loginSuccess: boolean;
  signUpSuccess: boolean;
  setFormData: (data: AuthStore["formData"]) => void;
  setError: (error: string) => void;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
  setLoginSuccess: (bool: boolean) => void;
  setSignUpSuccess: (bool: boolean) => void;
}

const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  formData: {
    username: "",
    password: "",
    firstName: "",
    lastName: "",
  },
  error: "",
  isAuthenticated: getInitialAuthState(),
  loading: false,
  loginSuccess: false,
  signUpSuccess: false,
  setFormData: (data) => {
    set({ formData: data });
  },
  setError: (error) => {
    set({ error });
  },

  signIn: async (username: string, password: string) => {
    try {
      set({ loading: true, error: "", loginSuccess: false });
      const request = await axios.post(
        "https://sketchapi.vaibz.xyz/auth/login",
        {
          username: username,
          password: password,
        }
      );
      const data = request.data;

      set({
        token: data.token,
        isAuthenticated: true,
        loading: false,
        loginSuccess: true,
        signUpSuccess: false,
        error: "",
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user_name", data.user.name);
        localStorage.setItem("user_email", data.user.email);
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "An unexpected error occurred",
        loading: false,
        isAuthenticated: false,
        token: null,
        loginSuccess: false,
        signUpSuccess: false,
      });
    }
  },

  signUp: async (username: string, password: string, name: string) => {
    try {
      set({ loading: true, error: "", signUpSuccess: false });
      const request = await axios.post(
        "https://sketchapi.vaibz.xyz/auth/register",
        {
          username: username,
          password: password,
          name: name,
        }
      );
      const data = request.data;
      if (request.status === 200) {
        set({
          loading: false,
          loginSuccess: false,
          signUpSuccess: true,
          error: "",
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "An unexpected error occurred",
        loading: false,
        isAuthenticated: false,
        token: null,
        loginSuccess: false,
        signUpSuccess: false,
      });
    }
  },
  signOut: () => {
    set({ token: null, isAuthenticated: false });
    if (typeof window !== "undefined") {
      removeLocalStorageData();
    }
  },
  setLoginSuccess: (bool: boolean) => {
    set({ loginSuccess: bool });
  },
  setSignUpSuccess: (bool: boolean) => {
    set({ signUpSuccess: bool });
  },
}));

export default useAuthStore;
