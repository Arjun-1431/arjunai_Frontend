import { useMutation, useQueryClient } from "@tanstack/react-query";
import "./dashboardPage.css";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";

const DashboardPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const formRef = useRef(null);
  const [output, setOutput] = useState(null); // To store the output for speech

  const mutation = useMutation({
    mutationFn: (text) => {
      return fetch(`arjunai-backend.vercel.app`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      }).then((res) => res.json());
    },
    onSuccess: (id, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["userChats"] });
      navigate(`/dashboard/chats/${id}`);
      
      // Set the output to be spoken
      const responseOutput = "This is the output: " + variables; // Modify this based on your API's actual response
      setOutput(responseOutput);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = e.target.text.value;
    if (!text) return;

    mutation.mutate(text);

    // Reset the input field after submitting
    e.target.reset();
  };

  const speakOutput = () => {
    if (output) {
      const utterance = new SpeechSynthesisUtterance(output);
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="dashboardPage">
      <div className="texts">
        <div className="logo">
          <img src="/logo.png" alt="" />
          <h1>Arjun AI</h1>
        </div>
        <div className="options">
          <div className="option">
            <img src="/chat.png" alt="" />
            <span>Create a New Chat</span>
          </div>
          <div className="option">
            <img src="/image.png" alt="" />
            <span>Analyze Images</span>
          </div>
          <div className="option">
            <img src="/code.png" alt="" />
            <span>Help me with my Code</span>
          </div>
        </div>
      </div>
      <div className="formContainer">
        <form onSubmit={handleSubmit} ref={formRef}>
          <input type="text" name="text" placeholder="Ask me anything..." />
          <button type="submit">
            <img src="/arrow.png" alt="" />
          </button>
        </form>
      </div>
      
      {/* If output is available, show the audio button */}
      {output && (
        <button onClick={speakOutput} className="audioButton">
          <img src="/audio-icon.png" alt="Speak" />
          Speak Output
        </button>
      )}
    </div>
  );
};

export default DashboardPage;
