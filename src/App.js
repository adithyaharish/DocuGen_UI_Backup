
import React, { useState } from "react";
import GithubLinkInput from "./components/GithubLinkInput";
import PersonaSelector from "./components/PersonaSelector";
import ChatInterface from "./components/ChatInterface";
import ProcessingIndicator from "./components/ProcessingIndicator";
import DocumentationPanel from "./components/DocumentationPanel";
import "./App.css";
import logo from "./assets/logo.png";




function App() {
  const [githubLink, setGithubLink] = useState("");
  const [persona, setPersona] = useState("intermediate");
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentation, setDocumentation] = useState("");
  const [processedData, setProcessedData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");




  const handleGenerateDocs = async () => {
    if (!githubLink.trim()) return;
    setIsProcessing(true);
    setDocumentation("");




    try {
      const response = await fetch("/generate-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubLink: githubLink.trim(),
          persona,
          branch: selectedBranch,
        }),
      });




      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }




      const data = await response.json();
      console.log("Received Data:", data);




      setDocumentation(data.gpt_summary || "No documentation generated.");




      if (data.branches && data.branches.length > 0) {
        setBranches(data.branches);
        setSelectedBranch(data.branches[0]); // Set default selected branch
      }
    } catch (error) {
      console.error("Documentation generation failed:", error);
      setDocumentation(
        "Error: Failed to generate documentation. Please check the GitHub URL and try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };




  const handleChatSubmit = async (message) => {
    if (!message.trim()) return;




    const newMessages = [...chatMessages, { sender: "user", text: message }];
    setChatMessages(newMessages);
    setIsChatLoading(true);




    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubLink,
          persona,
          documentation,
          userMessage: message,
        }),
      });




      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        { sender: "system", text: data.chatResponse || "No response received." },
      ]);
    } catch (error) {
      console.error("Error in chat interaction:", error);
      setChatMessages((prev) => [
        ...prev,
        { sender: "system", text: "Error processing request." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };




  return (
    <div className={darkMode ? "app dark-mode" : "app"}>
      <header className="app-header">
        <img src={logo} alt="DocuGen Logo" className="logo" />
        <h1>Documentation Generator</h1>
      </header>




      <div className="app-body">
        <aside className="sidebar">
          <GithubLinkInput githubLink={githubLink} setGithubLink={setGithubLink} />
          <PersonaSelector
            persona={persona}
            setPersona={setPersona}
            branches={branches}
            selectedBranch={selectedBranch}
            setSelectedBranch={setSelectedBranch} // Pass setSelectedBranch here
          />
          <button
            className="generate-docs-btn"
            onClick={handleGenerateDocs}
            disabled={isProcessing}
          >
            {isProcessing ? "Generating..." : "Generate Docs"}
          </button>
        </aside>




        <main className="main-panel">
          {isProcessing && <ProcessingIndicator />}
          {!isProcessing && documentation && (
            <>
              <DocumentationPanel documentation={documentation} />
              {processedData && (
                <div className="processed-data">
                  <h3>Processed Data</h3>
                  <pre>{JSON.stringify(processedData, null, 2)}</pre>
                </div>
              )}
              <ChatInterface messages={chatMessages} onChatSubmit={handleChatSubmit} chatLoading={isChatLoading} />
            </>
          )}
          {!isProcessing && !documentation && (
            <div className="placeholder">
              <p>Enter your GitHub link and select your persona to generate documentation.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}




export default App;

