//iranconnect-frontend/pages/index.js
import Layout from "../components/Layout";

import HeroSection from "../components/home/HeroSection";
import FeaturedCategories from "../components/home/FeaturedCategories";
import PopularCities from "../components/home/PopularCities";
import FeaturedBusinesses from "../components/home/FeaturedBusinesses";

export default function HomePage() {
  return (
    <Layout>
      <HeroSection />

      <FeaturedCategories />

      <PopularCities />

      <FeaturedBusinesses />
    </Layout>
  );
}
