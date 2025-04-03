
import React, { useState } from "react";
import "./ChatInterface.css";
import { FiSend } from "react-icons/fi";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import ReactMarkdown from "react-markdown";

const ChatInterface = ({ messages, onChatSubmit, chatLoading }) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    onChatSubmit(input);
    setInput("");
  };

  const renderMessage = (msg) => {
    return (
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <SyntaxHighlighter style={docco} language={match[1]} PreTag="div" {...props}>
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {msg.text}
      </ReactMarkdown>
    );
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>Chat Refinement</h2>
      </div>
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.sender}`}>
            <strong>{msg.sender}:</strong> {renderMessage(msg)}
          </div>
        ))}
        {chatLoading && (
          <div className="chat-loading">
            <em>Loading...</em>
          </div>
        )}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message to refine docs..."
        />
        <button className="send-btn" onClick={handleSend} disabled={chatLoading}>
        Send <FiSend style={{ marginRight: "0.3rem" }} /> 
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;


