"use client";

import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import Logo from "./Logo";
import Link from "next/link";
import GoogleIcon from "@mui/icons-material/Google";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/AuthStore";
import { useEffect } from "react";

interface AuthFormProps {
  mode: "signin" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const {
    formData,
    error,
    setFormData,
    signIn,
    signUp,
    loginSuccess,
    signUpSuccess,
    loading,
    setLoginSuccess,
    setSignUpSuccess,
  } = useAuthStore();
  const isSignIn = mode === "signin";
  const router = useRouter();
  useEffect(() => {
    if (loginSuccess) {
      router.replace("/canvas");
    }
    if (signUpSuccess) {
      router.replace("/signin");
    }
    return () => {
      setLoginSuccess(false);
      setSignUpSuccess(false);
    };
  }, [loginSuccess, signUpSuccess, router, setLoginSuccess, setSignUpSuccess]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signin") {
      await signIn(formData.username, formData.password);
    } else {
      await signUp(formData.username, formData.password, formData.firstName);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Logo />
        <Box sx={{ width: "100%" }}>
          <Typography variant="h4" align="center" gutterBottom>
            {isSignIn ? "Sign in to your account" : "Create an account"}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mb: 4 }}
          >
            {isSignIn
              ? "Enter your email below to sign in to your account"
              : "Enter your information below to create your account"}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={onSubmit} style={{ width: "100%" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {!isSignIn && (
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    fullWidth
                    label="First name"
                    variant="outlined"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                  <TextField
                    fullWidth
                    label="Last name"
                    variant="outlined"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </Box>
              )}
              <TextField
                fullWidth
                label="Email"
                type="email"
                variant="outlined"
                required
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                required
                helperText={
                  !isSignIn ? "Password must be at least 8 characters long" : ""
                }
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              {isSignIn ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <FormControlLabel
                    control={<Checkbox />}
                    label="Remember me"
                  />
                  <Link
                    href="/forgot-password"
                    style={{ textDecoration: "none" }}
                  >
                    <Typography
                      color="primary"
                      sx={{
                        fontSize: "0.875rem",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      Forgot password?
                    </Typography>
                  </Link>
                </Box>
              ) : (
                <FormControlLabel
                  control={<Checkbox required />}
                  label={
                    <Typography variant="body2">
                      I agree to the terms of service and privacy policy
                    </Typography>
                  }
                />
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ color: "white", mt: 1 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isSignIn ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </Button>
            </Box>
          </form>

          {/* <Box sx={{ mt: 3 }}>
            <Divider>
              <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
                OR CONTINUE WITH
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              sx={{ mt: 2 }}
            >
              Sign {isSignIn ? "in" : "up"} with Google
            </Button>
          </Box> */}

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 3 }}
          >
            {isSignIn ? "Don't have an account? " : "Already have an account? "}
            <Link
              href={isSignIn ? "/signup" : "/signin"}
              style={{ textDecoration: "none" }}
            >
              <Typography
                component="span"
                color="primary"
                sx={{
                  fontWeight: 500,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {isSignIn ? "Sign up" : "Sign in"}
              </Typography>
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
