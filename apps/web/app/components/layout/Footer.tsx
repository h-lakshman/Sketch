"use client";

import {
  Box,
  Container,
  Grid,
  Link as MuiLink,
  Typography,
} from "@mui/material";
import Logo from "../common/Logo";
import Link from "next/link";

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Testimonials", href: "#testimonials" },
      { label: "Pricing", href: "#pricing" },
      { label: "Download", href: "#download" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Help Center", href: "/help" },
      { label: "Community", href: "/community" },
      { label: "Templates", href: "/templates" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        backgroundColor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={8}>
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <Logo />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create, collaborate, and share your ideas with our intuitive
              diagramming tools. Join thousands of creators today.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Sketch. All rights reserved.
            </Typography>
          </Grid>
          {footerLinks.map((section) => (
            <Grid item xs={6} sm={3} md={2} key={section.title}>
              <Typography
                variant="subtitle2"
                color="text.primary"
                sx={{ fontWeight: 600, mb: 2 }}
              >
                {section.title}
              </Typography>
              <Box
                component="ul"
                sx={{
                  listStyle: "none",
                  p: 0,
                  m: 0,
                }}
              >
                {section.links.map((link) => (
                  <Box component="li" key={link.label} sx={{ mb: 1 }}>
                    <Link href={link.href} passHref legacyBehavior>
                      <MuiLink
                        underline="hover"
                        color="text.secondary"
                        sx={{ fontSize: "0.875rem" }}
                      >
                        {link.label}
                      </MuiLink>
                    </Link>
                  </Box>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
