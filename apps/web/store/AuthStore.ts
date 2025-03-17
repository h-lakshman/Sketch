import axios from "axios";
import { create } from "zustand";

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
  isAuthenticated: !!localStorage.getItem("token"),
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
    set({ loading: true, error: "", loginSuccess: false });
    const request = await axios.post("http://localhost:3001/auth/login", {
      username: username,
      password: password,
    });
    const data = request.data;
    try {
      set({
        token: data.token,
        isAuthenticated: true,
        loading: false,
        loginSuccess: true,
        signUpSuccess: false,
        error: "",
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user_name", data.user.name);
      localStorage.setItem("user_email", data.user.email);
    } catch (error) {
      set({
        error: data.error || "An unexpected error occurred",
        loading: false,
        isAuthenticated: false,
        token: null,
        loginSuccess: false,
        signUpSuccess: false,
      });
    }
  },

  signUp: async (username: string, password: string, name: string) => {
    set({ loading: true, error: "", signUpSuccess: false });
    const request = await axios.post("http://localhost:3001/auth/register", {
      username: username,
      password: password,
      name: name,
    });
    const data = request.data;
    try {
      set({
        loading: false,
        loginSuccess: false,
        signUpSuccess: true,
        error: "",
      });
    } catch (error) {
      set({
        error: data.error || "An unexpected error occurred",
        loading: false,
        isAuthenticated: false,
        token: null,
        loginSuccess: false,
        signUpSuccess: false,
      });
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
