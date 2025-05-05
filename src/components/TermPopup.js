import React, { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import "./TermPopup.css";   // keep the styles in one place

export default function TermPopup({ term, position, onClose, snippet}) {
  const [info, setInfo]       = useState("Thinking…");
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/term-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            term,
            snippet // Added missing snippet
          })
        });
        
        if (!res.ok) throw new Error(await res.text());
        
        const data = await res.json();
        if (!cancel) setInfo(data.answer || "No details available.");
      } catch (err) {
        if (!cancel) setInfo(`⚠︎ Error: ${err.message}`);
      }
    })();
    return () => (cancel = true);
  }, [term, snippet]); // Add snippet to dependencies




  // ─────────────────────────────────────────────────────────────
// Replace the old sendFollowUp with the one below
// ─────────────────────────────────────────────────────────────
const sendFollowUp = async (promptText) => {
  // 1️⃣ pick the text to send – either from a button or the input box
  const question = (promptText ?? input).trim();
  if (!question) return;

  // 2️⃣ show a placeholder while we wait
  setInfo("Thinking…");
  setLoading(true);

  try {
    const res = await fetch("http://localhost:5000/term-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        term,
        snippet,
        history: [
          { role: "assistant", content: info }, // last assistant reply only
          { role: "user",      content: question }
        ]
      })
    });

    if (!res.ok) {
      // the backend returned an HTTP error code
      throw new Error(await res.text());
    }

    const data   = await res.json();
    const answer =
      data.answer           // preferred key
      ?? data.chatResponse  // fallback if backend uses a different name
      ?? "";                // empty string if nothing came back

    setInfo(answer || "⚠️ No answer returned.");
  } catch (err) {
    setInfo(`⚠️ ${err.message}`);
  } finally {
    setLoading(false);
    setInput("");           // clear the input box
  }
};


  return (
    <>
      <div className="popup-overlay-lite" onClick={onClose} />
      <div
  className="term-popup"
  style={{
    position: "fixed",
    top: `${position.top}px`,
    left: `${position.left}px`,
    margin: "0 auto"
  }}
>

      {/* <div className="term-popup" style={{ top: position.top, left: position.left }}> */}
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <h4>{term}</h4>
        {/* <p className="term-body">{info}</p> */}
        <div className="term-body"> {/* Wrap in div with class */}
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match?.[1] || 'bash'}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        }
      }}
    >
      {info}
    </ReactMarkdown>
  </div>

        <div className="popup-buttons">
        <button disabled={loading} onClick={() => sendFollowUp(`More details about ${term}`)}>
          {/* <button disabled={loading} onClick={() => setInput("More details about " + term)}> */}
            More details
          </button>
          <button disabled={loading} onClick={() => sendFollowUp(`Give an example of ${term}`)}>
          {/* <button disabled={loading} onClick={() => setInput("Give an example of " + term)}> */}
            Examples
          </button>
          <button disabled={loading} onClick={() => sendFollowUp(`Show similar to ${term}`)}>
          {/* <button disabled={loading} onClick={() => setInput("Show similar to " + term)}> */}
            Search similar
          </button>
        </div>

        <div className="popup-chat">
          <input
            type="text"
            placeholder="Ask about this term…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendFollowUp()}
          />
          <button className="send-icon" onClick={() => sendFollowUp()} disabled={loading}>
          {/* <button className="send-icon" onClick={sendFollowUp} disabled={loading}> */}
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
