"use client";

import { AppBar, Box, Button, Container, Stack, Toolbar } from "@mui/material";
import Logo from "../common/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";

// const navItems = [
//   { label: "Features", href: "#features" },
//   { label: "Testimonials", href: "#testimonials" },
//   { label: "Pricing", href: "#pricing" },
// ];

function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <AppBar
      position="fixed"
      color="transparent"
      elevation={0}
      sx={{
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ height: 64 }}>
          <Logo />
          <Stack
            direction="row"
            spacing={4}
            alignItems="center"
            sx={{ ml: "auto" }}
          >
            {/* {isHome && (
              <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3 }}>
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    style={{ textDecoration: "none" }}
                  >
                    <Button
                      color="inherit"
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 500,
                        "&:hover": { backgroundColor: "transparent" },
                      }}
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </Box>
            )} */}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Link href="/signin" style={{ textDecoration: "none" }} prefetch>
                <Button variant="text" color="inherit" sx={{ fontWeight: 500 }}>
                  Sign In
                </Button>
              </Link>
              <Link href="/signup" style={{ textDecoration: "none" }} prefetch>
                <Button
                  variant="contained"
                  sx={{
                    color: "white",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                  }}
                >
                  Sign Up
                </Button>
              </Link>
            </Box>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Header;
