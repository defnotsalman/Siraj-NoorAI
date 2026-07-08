import Dashboard from "../components/Dashboard";
import ContinueReading from "../components/ContinueReading";
import Achievements from "../components/Achievements";
import Hero from "../components/Hero";
import Features from "../components/Features";
import StoryLibrary from "./StoryLibrary";

function Home() {
  return (
    <>
      <Dashboard />
      <ContinueReading />
      <Achievements />
      <Hero />
      <Features />
      <StoryLibrary />
    </>
  );
}

export default Home;