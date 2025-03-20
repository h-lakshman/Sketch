"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const isPublicRoute = (pathname: string) => {
  const publicRoutes = ["/", "/signin", "/signup"];
  return publicRoutes.includes(pathname);
};

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const isPublic = isPublicRoute(pathname || "");

      if (!isPublic && !token) {
        router.replace("/signin");
        return;
      }
    }
  }, [pathname, router]);

  return <>{children}</>;
}
