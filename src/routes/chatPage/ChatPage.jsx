import "./chatPage.css";
import NewPrompt from "../../components/newPrompt/NewPrompt";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import Markdown from "react-markdown";
import { IKImage } from "imagekitio-react";
import { useState, useEffect, useRef } from "react";

const ChatPage = () => {
  const path = useLocation().pathname;
  const chatId = path.split("/").pop();

  // State to hold the chat history
  const [chatHistory, setChatHistory] = useState([]);
  const [newMessage, setNewMessage] = useState(""); // For input message

  const endRef = useRef(null); // Ref for auto-scroll to the last message

  // Fetching chat data with React Query
  const { isPending, error, data } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`, {
        credentials: "include",
      }).then((res) => res.json()),
    onSuccess: (fetchedData) => {
      // Initialize chat history with fetched data
      setChatHistory(fetchedData?.history || []);
    },
  });

  // Automatically scroll to the latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Reset chat history when the chat ID changes
  useEffect(() => {
    setChatHistory([]);
  }, [chatId]);

  // Handler to send a new message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Add new message to the chat history
      const newMessageObject = {
        role: "user",
        parts: [{ text: newMessage }],
      };

      // Update chat history with the new message
      setChatHistory((prevHistory) => [...prevHistory, newMessageObject]);

      setNewMessage(""); // Clear the input field
    }
  };

  return (
    <div className="chatPage">
      <div className="wrapper">
        <div className="chat">
          {/* Show loading, error, or chat messages */}
          {isPending ? (
            "Loading..."
          ) : error ? (
            "Something went wrong!"
          ) : (
            chatHistory.map((message, i) => (
              <div key={i} className="messageContainer">
                {message.img && (
                  <IKImage
                    urlEndpoint={"https://ik.imagekit.io/lamadev"}
                    path={message.img}
                    height="50"
                    width="100"
                    transformation={[{ height: 50, width: 100 }]}
                    loading="lazy"
                    lqip={{ active: true, quality: 20 }}
                  />
                )}
                <div
                  className={
                    message.role === "user" ? "message user" : "message"
                  }
                >
                  <Markdown>{message.parts[0].text}</Markdown>
                </div>
              </div>
            ))
          )}

          {/* Auto-scroll reference */}
          <div ref={endRef}></div>

          {/* Render the NewPrompt component if data exists */}
          {data && <NewPrompt data={data} />}
        </div>

      </div>
    </div>
  );
};

export default ChatPage;