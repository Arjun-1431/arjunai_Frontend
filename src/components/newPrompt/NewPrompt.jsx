import { useEffect, useRef, useState } from "react";
import "./newPrompt.css";
import Upload from "../upload/Upload";
import { IKImage } from "imagekitio-react";
import model from "../../lib/gemini";
import Markdown from "react-markdown";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const NewPrompt = ({ data }) => {
  const [chatHistory, setChatHistory] = useState([]); // Stores full chat history
  const [question, setQuestion] = useState(""); // Current question input
  const [answer, setAnswer] = useState(""); // Current AI answer
  const [isSubmitting, setIsSubmitting] = useState(false); // Tracks form submission
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: {},
  });

  const chat = useRef(
    model.startChat({
      history: [
        ...(data?.history || []).map(({ role, parts }) => ({
          role,
          parts: [{ text: parts[0].text }],
        })),
      ],
      generationConfig: {},
    })
  );

  const endRef = useRef(null);
  const queryClient = useQueryClient();

  // Automatically scroll to the latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const mutation = useMutation({
    mutationFn: () => {
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.length ? question : undefined,
          answer,
          img: img.dbData?.url || undefined,
        }),
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", data._id] }).then(() => {
        setQuestion("");
        setAnswer("");
        setImg({ isLoading: false, error: "", dbData: {}, aiData: {} }); // Reset image
      });
    },
    onError: (err) => {
      console.error(err);
    },
  });

  const add = async (text, isInitial) => {
    if (!isInitial) setQuestion(text);
    try {
      setIsSubmitting(true); // Start loading
      const result = await chat.current.sendMessageStream(
        Object.entries(img.aiData).length ? [img.aiData, text] : [text]
      );
      let accumulatedText = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        accumulatedText += chunkText;
        setAnswer(accumulatedText);
      }

      setChatHistory((prevHistory) => [
        ...prevHistory,
        { question: text, image: img.dbData?.url || null, answer: accumulatedText },
      ]);

      mutation.mutate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false); // Stop loading
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = e.target.text.value.trim(); // Get input value
    if (!text) return;

    add(text, false);

    e.target.text.value = ""; // Clear input field
  };

  const hasRun = useRef(false);
  useEffect(() => {
    if (!hasRun.current && data?.history?.length === 1) {
      add(data.history[0].parts[0].text, true);
    }
    hasRun.current = true;
  }, [data]);

  return (
    <>
      {/* Display full chat history */}
      <div className="chatHistory">
        {chatHistory.map((entry, i) => (
          <div key={i} className="messageContainer">
            <div className="message user">User: {entry.question}</div>
            {entry.image && (
              <IKImage
                urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
                src={entry.image}
                width="380"
                transformation={[{ width: 380 }]}
                alt="Uploaded"
              />
            )}
            <div className="message">
              Answer: <Markdown>{entry.answer}</Markdown>
            </div>
          </div>
        ))}
      </div>

      {/* Auto-scroll reference */}
      <div ref={endRef}></div>

      {/* Form for submitting a new question */}
      <form className="newForm" onSubmit={handleSubmit}>
        <Upload setImg={setImg} />
        <input id="file" type="file" multiple={false} hidden />
        <input
          type="text"
          name="text"
          placeholder="Ask anything..."
          defaultValue={question}
          disabled={img.isLoading || isSubmitting} // Disable input during loading
        />
        <button type="submit" disabled={img.isLoading || isSubmitting}>
          {isSubmitting || img.isLoading ? (
            <span className="loadingSpinner"></span> // Spinner animation
          ) : (
            <img src="/arrow.png" alt="Submit" />
          )}
        </button>
      </form>
    </>
  );
};

export default NewPrompt;
