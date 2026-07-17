import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AIChat from "../components/AI/AIChat";

function AI() {
  const { storyId } = useParams();
  const [storyTitle, setStoryTitle] = useState("");

  useEffect(() => {
    if (storyId) {
      fetch(`http://192.168.1.69:5000/api/stories/${storyId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.title) {
            setStoryTitle(data.title);
          }
        })
        .catch(err => console.error("Error fetching story title:", err));
    }
  }, [storyId]);

  return (
    <div className="max-w-5xl mx-auto p-10 text-white">
      <h1 className="text-5xl font-bold mb-6">
        🤖 NoorKids AI Teacher
      </h1>
      
      {storyTitle && (
        <div className="mb-6 inline-block bg-blue-500/30 text-blue-200 px-4 py-2 rounded-full font-medium">
          📖 Chatting about: {storyTitle}
        </div>
      )}

      {!storyId ? (
        <div className="bg-[#18345F] rounded-3xl p-8 text-center h-[500px] flex flex-col items-center justify-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold mb-4">Select a Story to begin!</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-md">
            I am your NoorKids AI teacher! To ask me questions, please go to the Stories page, pick a story, and click "Ask AI".
          </p>
          <a href="/stories" className="bg-green-500 px-6 py-3 rounded-full hover:scale-105 transition font-bold">
            Go to Stories
          </a>
        </div>
      ) : (
        <AIChat storyId={storyId} storyTitle={storyTitle} />
      )}
    </div>
  );
}

export default AI;