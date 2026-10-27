import Hero from '../sections/Hero.jsx';
import HowItWorks from '../sections/HowItWorks.jsx';
import Gallery from '../sections/Gallery.jsx';
import Packages from '../sections/Packages.jsx';
import Season from '../sections/Season.jsx';
import ServiceArea from '../sections/ServiceArea.jsx';
import Reviews from '../sections/Reviews.jsx';
import Faq from '../sections/Faq.jsx';
import FinalCta from '../sections/FinalCta.jsx';

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Gallery />
      <Packages />
      <Season />
      <ServiceArea />
      <Reviews />
      <Faq />
      <FinalCta />
    </>
  );
}
