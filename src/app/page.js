"use client";

import { Box, Button, Stack, TextField } from "@mui/material";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm Pantry services personal assistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState("");

  const sendMessage = async () => {
    setMessage(""); // Clear the input field
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message }, // Add the user's message to the chat
      { role: "assistant", content: "" }, // Add a placeholder for the assistant's response
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, { role: "user", content: message }]),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        console.log({ text });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          console.log({ otherMessages, lastMessage });
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content:
            "I'm sorry, but I encountered an error. Please try again later.",
        },
      ]);
    }
  };
  function formatContent(content) {
    // Convert **text** to <strong>text</strong>
    content = content.replace(
      /\*\*\*(.*?)\*\*\*/g,
      "<strong><em>$1</em></strong>"
    );
    content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    content = content.replace(/\*(.*?)\*/g, "<em>$1</em>");

    return content;
  }
  return (
    <div className="chat-container">
      <div className="chat-box">
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message-wrapper ${
                msg.role === "assistant" ? "assistant-wrapper" : "user-wrapper"
              }`}
            >
              <div
                className={`chat-message ${
                  msg.role === "assistant" ? "assistant" : "user"
                }`}
                dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
              >
                {}
              </div>
            </div>
          ))}
        </div>
        <div className="input-container">
          <input
            type="text"
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}
