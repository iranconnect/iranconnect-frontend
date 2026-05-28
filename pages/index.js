//iranconnect-frontend/pages/index.js
import Layout from "../components/Layout";

import HeroSection from "../components/home/HeroSection";
import FeaturedCategories from "../components/home/FeaturedCategories";

export default function HomePage() {
  return (
    <Layout>
      <HeroSection />

      <FeaturedCategories />
    </Layout>
  );
}
