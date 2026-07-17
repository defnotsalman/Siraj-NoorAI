import { BookOpen, Sparkles, Trophy } from "lucide-react";
import FeatureCard from "./FeatureCard";
import { useState, useEffect } from "react";

function Features() {
  const [storyCount, setStoryCount] = useState(57); // Default fallback

  useEffect(() => {
    fetch('http://192.168.18.64:5000/api/stories')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          setStoryCount(data.length);
        }
      })
      .catch(err => console.error("Failed to fetch stories count", err));
  }, []);

  return (
    <section className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 py-16">

      <FeatureCard
        icon={BookOpen}
        title={`${storyCount} Stories`}
        description="Beautiful Islamic stories for kids, carefully written and narrated."
      />

      <FeatureCard
        icon={Sparkles}
        title="AI Assistant"
        description="Ask questions and explore topics about every single story."
      />

      <FeatureCard
        icon={Trophy}
        title="Earn Rewards"
        description="Complete quizzes, build your reading streak, and unlock badges."
      />

    </section>
  );
}

export default Features;