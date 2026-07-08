import { BookOpen, Sparkles, Trophy } from "lucide-react";
import FeatureCard from "./FeatureCard";

function Features() {
  return (
    <section className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 py-16">

      <FeatureCard
        icon={BookOpen}
        title="57 Stories"
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