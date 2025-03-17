import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import Link from 'next/link';
import BoltIcon from '@mui/icons-material/Bolt';
import GroupsIcon from '@mui/icons-material/Groups';
import ShareIcon from '@mui/icons-material/Share';
import LayersIcon from '@mui/icons-material/Layers';
import PaletteIcon from '@mui/icons-material/Palette';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HeroSection from './components/home/HeroSection';
import FeaturesSection from './components/home/FeaturesSection';
import TestimonialsSection from './components/home/TestimonialsSection';
import CtaSection from './components/home/CtaSection';

const features = [
  {
    icon: <BoltIcon sx={{ fontSize: 40 }} />,
    title: "Intuitive Drawing",
    description: "Simple yet powerful tools that make drawing diagrams a breeze",
  },
  {
    icon: <GroupsIcon sx={{ fontSize: 40 }} />,
    title: "Real-time Collaboration",
    description: "Work together with your team in real-time, no matter where they are",
  },
  {
    icon: <ShareIcon sx={{ fontSize: 40 }} />,
    title: "Easy Sharing",
    description: "Share your creations with a simple link or export to various formats",
  },
  {
    icon: <LayersIcon sx={{ fontSize: 40 }} />,
    title: "Infinite Canvas",
    description: "Never run out of space with our infinite canvas technology",
  },
  {
    icon: <PaletteIcon sx={{ fontSize: 40 }} />,
    title: "Customizable Styles",
    description: "Personalize your diagrams with custom colors, fonts, and styles",
  },
  {
    icon: <AutoFixHighIcon sx={{ fontSize: 40 }} />,
    title: "Smart Shapes",
    description: "Create perfect shapes with our intelligent recognition system",
  },
];

const testimonials = [
  {
    avatar: "JD",
    name: "Jane Doe",
    role: "Product Designer",
    content: "Sketch has completely transformed how I create wireframes. The intuitive interface makes it so easy to bring my ideas to life.",
  },
  {
    avatar: "JS",
    name: "John Smith",
    role: "Software Engineer",
    content: "The collaboration features are game-changing. My team can work together on diagrams in real-time, making our planning sessions much more productive.",
  },
  {
    avatar: "AL",
    name: "Amy Lee",
    role: "Project Manager",
    content: "Sketch has become an essential tool for our team meetings. We use it to visualize ideas and make decisions faster than ever before.",
  },
];

export default function Home() {
  return (
    <Box>
      <Header />

      <HeroSection />
      <FeaturesSection features={features} />
      <TestimonialsSection testimonials={testimonials} />
      <CtaSection />

      <Footer />
    </Box>
  );
}
