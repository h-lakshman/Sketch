"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Suspense } from "react";
import theme from "./theme";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Loading from "./components/common/Loading";
import AuthCheck from "./components/auth/AuthCheck";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthCheck>
              <Suspense fallback={<Loading />}>
                <div
                  className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                >
                  {children}
                </div>
              </Suspense>
            </AuthCheck>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
