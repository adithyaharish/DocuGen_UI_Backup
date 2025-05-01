import React, { useState, useEffect } from "react";
import GithubLinkInput from "./components/GithubLinkInput";
import PersonaSelector from "./components/PersonaSelector";
import ChatInterface from "./components/ChatInterface";
import ProcessingIndicator from "./components/ProcessingIndicator";
import DocumentationPanel from "./components/DocumentationPanel";
import DocDiffViewer from "./components/DocDiffViewer";
import "./App.css";
import logo from "./assets/logo.png";

function App() {
  const [githubLink, setGithubLink] = useState("");
  const [persona, setPersona] = useState("intermediate");
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [showDiff, setShowDiff] = useState(false);

  const [docVersions, setDocVersions] = useState({});
  const [selectedVersion, setSelectedVersion] = useState("");
  const [editableContent, setEditableContent] = useState("");

  const [documentation, setDocumentation] = useState("");
  const [processedData, setProcessedData] = useState(null);

  const handleGenerateDocs = async () => {
    if (!githubLink.trim()) return;
    setChatMessages([]);
    setIsProcessing(true);
    setDocumentation("");

    try {
      const response = await fetch("http://localhost:5000/generate-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubLink: githubLink.trim(),
          persona,
          branch: selectedBranch,
        }),
      });

      const data = await response.json();
      const baseDoc = data.gpt_summary || "No documentation generated.";
      const initialVersion = {
        Original: { content: baseDoc, label: "Original version" },
      };

      setDocVersions(initialVersion);
      setSelectedVersion("Original");
      setEditableContent(baseDoc);

      if (data.branches?.length > 0) {
        setBranches(data.branches);
        setSelectedBranch(data.branches[0]);
      }
    } catch (error) {
      console.error("Documentation generation failed:", error);
      setDocVersions({
        Original: {
          content: "Error: Could not generate documentation.",
          label: "Generation Error",
        },
      });
      setSelectedVersion("Original");
      setEditableContent("Error: Could not generate documentation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const insertIntoRelevantSection = (base, enhancement) => {
    const sectionTitle = "### 2. Complete API Reference";
    const parts = base.split(sectionTitle);
    if (parts.length < 2) return `${base.trim()}\n\n### 🔄 Refinement\n${enhancement}`;
    return `${parts[0]}${sectionTitle}\n${enhancement.trim()}\n${parts[1]}`;
  };

  const handleChatSubmit = async (message) => {
    if (!message.trim()) return;

    const newMessages = [...chatMessages, { sender: "user", text: message }];
    setChatMessages(newMessages);
    setIsChatLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubLink,
          persona,
          documentation: docVersions[selectedVersion].content,
          userMessage: message,
        }),
      });

      const data = await response.json();
      const delta = data.chatResponse || "No response received.";

      const base = docVersions[selectedVersion]?.content || "";
      const merged = insertIntoRelevantSection(base, delta);

      const versionNumber = Object.keys(docVersions).length;
      const versionName = `Version ${versionNumber}`;

      const userLabel = prompt("📌 Add a label for this refined version:");
      const finalLabel = userLabel?.trim() || "Refinement";

      setDocVersions((prev) => ({
        ...prev,
        [versionName]: { content: merged, label: finalLabel },
      }));

      setSelectedVersion(versionName);

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "system",
          text: `📄 New version added as "${versionName} – ${finalLabel}".`,
          isMarkdown: false,
        },
      ]);
    } catch (error) {
      console.error("Error in chat interaction:", error);
      setChatMessages((prev) => [
        ...prev,
        { sender: "system", text: "Error processing request.", isMarkdown: true },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleVersionChange = (newVersion) => {
    setDocVersions((prev) => ({
      ...prev,
      [selectedVersion]: {
        ...prev[selectedVersion],
        content: editableContent,
      },
    }));
    setSelectedVersion(newVersion);
    setEditableContent(docVersions[newVersion]?.content || "");
  };

  useEffect(() => {
    if (selectedVersion && docVersions[selectedVersion]) {
      setEditableContent(docVersions[selectedVersion].content);
    }
  }, [selectedVersion]);

  return (
    <div className={isProcessing ? "app dark-mode" : "app"}>
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
            setSelectedBranch={setSelectedBranch}
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

          {!isProcessing && Object.keys(docVersions).length > 0 && (
            <>
              <div className="version-dropdown-wrapper">
                <label htmlFor="version-select"><strong>View Version:</strong></label>{" "}
                <select
                  id="version-select"
                  value={selectedVersion}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  style={{ marginTop: "0.5rem", padding: "0.4rem", borderRadius: "4px" }}
                >
                  {Object.entries(docVersions).map(([versionName, { label }]) => (
                    <option key={versionName} value={versionName}>
                      {versionName} – {label}
                    </option>
                  ))}
                </select>

                {selectedVersion !== "Original" && (
                  <div style={{ marginTop: "0.5rem", display: "flex", gap: "1rem" }}>
                    <button
                      onClick={() => {
                        const newLabel = prompt("✏️ Rename this version:");
                        if (newLabel?.trim()) {
                          setDocVersions((prev) => ({
                            ...prev,
                            [selectedVersion]: {
                              ...prev[selectedVersion],
                              label: newLabel.trim(),
                            },
                          }));
                        }
                      }}
                    >
                      ✏️ Rename
                    </button>
                    <button
                      onClick={() => {
                        const confirmed = window.confirm(`Delete "${selectedVersion}"?`);
                        if (confirmed) {
                          setDocVersions((prev) => {
                            const updated = { ...prev };
                            delete updated[selectedVersion];
                            const fallback = Object.keys(updated)[0] || "";
                            setSelectedVersion(fallback);
                            return updated;
                          });
                        }
                      }}
                    >
                      🗑️ Delete
                    </button>
                    <button
                      onClick={() => setShowDiff((prev) => !prev)}
                      style={{ backgroundColor: "#f0f0f0" }}
                    >
                      {showDiff ? "Hide Diff" : "Compare with Original"}
                    </button>
                  </div>
                )}
              </div>

              {showDiff && selectedVersion !== "Original" ? (
                <DocDiffViewer
                  original={docVersions["Original"].content}
                  edited={docVersions[selectedVersion].content}
                />
              ) : (
                <div className={`doc-container ${!showChat ? "full-height" : ""}`}>
                  <DocumentationPanel
                    documentation={editableContent}
                    setDocumentation={(newContent) => {
                      setEditableContent(newContent);
                      setDocVersions((prev) => ({
                        ...prev,
                        [selectedVersion]: {
                          ...prev[selectedVersion],
                          content: newContent,
                        },
                      }));
                    }}
                  />
                </div>
              )}

              <div className={`chat-slide-wrapper ${showChat ? "open" : "closed"}`}>
                <ChatInterface
                  messages={chatMessages}
                  onChatSubmit={handleChatSubmit}
                  chatLoading={isChatLoading}
                />
              </div>

              <button
                onClick={() => setShowChat(!showChat)}
                style={{
                  margin: "1rem 0",
                  padding: "0.4rem 1rem",
                  background: "#e2e2e2",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                {showChat ? "Hide Chat" : "Show Chat"}
              </button>
            </>
          )}

          {!isProcessing && Object.keys(docVersions).length === 0 && (
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




















// import React, { useState, useEffect } from "react";
// import GithubLinkInput from "./components/GithubLinkInput";
// import PersonaSelector from "./components/PersonaSelector";
// import ChatInterface from "./components/ChatInterface";
// import ProcessingIndicator from "./components/ProcessingIndicator";
// import DocumentationPanel from "./components/DocumentationPanel";
// import DocDiffViewer from "./components/DocDiffViewer"; // ✅ Make sure this path is correct
// import "./App.css";
// import logo from "./assets/logo.png";

// function App() {
//   const [githubLink, setGithubLink] = useState("");
//   const [persona, setPersona] = useState("intermediate");
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [chatMessages, setChatMessages] = useState([]);
//   const [isChatLoading, setIsChatLoading] = useState(false);
//   const [branches, setBranches] = useState([]);
//   const [selectedBranch, setSelectedBranch] = useState("");
//   const [showChat, setShowChat] = useState(true);
//   const [showDiff, setShowDiff] = useState(false); // ✅ for version comparison

//   const [docVersions, setDocVersions] = useState({});
//   const [selectedVersion, setSelectedVersion] = useState("");
//   const [editableContent, setEditableContent] = useState("");

//   const handleGenerateDocs = async () => {
//     if (!githubLink.trim()) return;
//     setChatMessages([]);
//     setIsProcessing(true);

//     try {
//       const response = await fetch("http://localhost:5000/generate-docs", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           githubLink: githubLink.trim(),
//           persona,
//           branch: selectedBranch,
//         }),
//       });

//       const data = await response.json();
//       const baseDoc = data.gpt_summary || "No documentation generated.";
//       const initialVersion = {
//         Original: { content: baseDoc, label: "Original version" },
//       };

//       setDocVersions(initialVersion);
//       setSelectedVersion("Original");
//       setEditableContent(baseDoc);

//       if (data.branches?.length > 0) {
//         setBranches(data.branches);
//         setSelectedBranch(data.branches[0]);
//       }
//     } catch (error) {
//       console.error("Documentation generation failed:", error);
//       setDocVersions({
//         Original: {
//           content: "Error: Could not generate documentation.",
//           label: "Generation Error",
//         },
//       });
//       setSelectedVersion("Original");
//       setEditableContent("Error: Could not generate documentation.");
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const handleChatSubmit = async (message) => {
//     if (!message.trim()) return;

//     const newMessages = [...chatMessages, { sender: "user", text: message }];
//     setChatMessages(newMessages);
//     setIsChatLoading(true);

//     try {
//       const response = await fetch("http://localhost:5000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           githubLink,
//           persona,
//           documentation: docVersions[selectedVersion].content,
//           userMessage: message,
//         }),
//       });

//       const data = await response.json();
//       const delta = data.chatResponse || "No response received.";

//       const base = docVersions[selectedVersion]?.content || "";
//       const merged = mergeRefinementIntoSection(base, delta, targetSection);
      
//       const [targetSection, setTargetSection] = useState("Complete API Reference");

//       const versionNumber = Object.keys(docVersions).length;
//       const versionName = `Version ${versionNumber}`;
//       const userLabel = prompt("📌 Add a label for this refined version:");
//       const finalLabel = userLabel?.trim() || "Refinement";

//       setDocVersions((prev) => ({
//         ...prev,
//         [versionName]: {
//           content: merged,
//           label: finalLabel,
//         },
//       }));

//       setSelectedVersion(versionName);

//       setChatMessages((prev) => [
//         ...prev,
//         {
//           sender: "system",
//           text: `📄 A new refined version has been added as "${versionName} – ${finalLabel}".`,
//           isMarkdown: false,
//         },
//       ]);
//     } catch (error) {
//       console.error("Error in chat interaction:", error);
//       setChatMessages((prev) => [
//         ...prev,
//         { sender: "system", text: "Error processing request.", isMarkdown: true },
//       ]);
//     } finally {
//       setIsChatLoading(false);
//     }
//   };

//   const handleVersionChange = (newVersion) => {
//     setDocVersions((prev) => ({
//       ...prev,
//       [selectedVersion]: {
//         ...prev[selectedVersion],
//         content: editableContent,
//       },
//     }));
//     setSelectedVersion(newVersion);
//     setEditableContent(docVersions[newVersion]?.content || "");
//   };

//   useEffect(() => {
//     if (selectedVersion && docVersions[selectedVersion]) {
//       setEditableContent(docVersions[selectedVersion].content);
//     }
//   }, [selectedVersion]);

//   return (
//     <div className={isProcessing ? "app dark-mode" : "app"}>
//       <header className="app-header">
//         <img src={logo} alt="DocuGen Logo" className="logo" />
//         <h1>Documentation Generator</h1>
//       </header>

//       <div className="app-body">
//         <aside className="sidebar">
//           <GithubLinkInput githubLink={githubLink} setGithubLink={setGithubLink} />
//           <PersonaSelector
//             persona={persona}
//             setPersona={setPersona}
//             branches={branches}
//             selectedBranch={selectedBranch}
//             setSelectedBranch={setSelectedBranch}
//           />
//           <button
//             className="generate-docs-btn"
//             onClick={handleGenerateDocs}
//             disabled={isProcessing}
//           >
//             {isProcessing ? "Generating..." : "Generate Docs"}
//           </button>
//         </aside>

//         <main className="main-panel">
//           {isProcessing && <ProcessingIndicator />}

//           {!isProcessing && Object.keys(docVersions).length > 0 && (
//             <>
//               <div className="version-dropdown-wrapper">
//                 <label htmlFor="version-select"><strong>View Version:</strong></label>{" "}
//                 <select
//                   id="version-select"
//                   value={selectedVersion}
//                   onChange={(e) => handleVersionChange(e.target.value)}
//                   style={{ marginTop: "0.5rem", padding: "0.4rem", borderRadius: "4px" }}
//                 >
//                   {Object.entries(docVersions).map(([versionName, { label }]) => (
//                     <option key={versionName} value={versionName}>
//                       {versionName} – {label}
//                     </option>
//                   ))}
//                 </select>

//                 {selectedVersion !== "Original" && (
//                   <div style={{ marginTop: "0.5rem", display: "flex", gap: "1rem" }}>
//                     <button
//                       onClick={() => {
//                         const newLabel = prompt("✏️ Rename this version:");
//                         if (newLabel?.trim()) {
//                           setDocVersions((prev) => ({
//                             ...prev,
//                             [selectedVersion]: {
//                               ...prev[selectedVersion],
//                               label: newLabel.trim(),
//                             },
//                           }));
//                         }
//                       }}
//                     >
//                       ✏️ Rename
//                     </button>

//                     <button
//                       onClick={() => {
//                         const confirmed = window.confirm(`Delete "${selectedVersion}"?`);
//                         if (confirmed) {
//                           setDocVersions((prev) => {
//                             const updated = { ...prev };
//                             delete updated[selectedVersion];
//                             const fallback = Object.keys(updated)[0] || "";
//                             setSelectedVersion(fallback);
//                             return updated;
//                           });
//                         }
//                       }}
//                     >
//                       🗑️ Delete
//                     </button>
//                   </div>
//                 )}
//               </div>

//               {/* 🔍 Diff Toggle Button */}
//               {selectedVersion !== "Original" && (
//                 <button
//                   onClick={() => setShowDiff(!showDiff)}
//                   style={{
//                     marginTop: "1rem",
//                     padding: "0.4rem 1rem",
//                     background: "#f0f0f0",
//                     border: "1px solid #ccc",
//                     borderRadius: "6px",
//                     cursor: "pointer",
//                   }}
//                 >
//                   {showDiff ? "Hide Comparison" : "Compare with Original"}
//                 </button>
//               )}

//               {/* 🟩🟥 Show Side-by-Side Diff */}
//               {showDiff && selectedVersion !== "Original" && (
//                 <DocDiffViewer
//                   original={docVersions["Original"].content}
//                   edited={docVersions[selectedVersion].content}
//                 />
//               )}

//               {!showDiff && (
//                 <div className={`doc-container ${!showChat ? "full-height" : ""}`}>
//                   <DocumentationPanel
//                     documentation={editableContent}
//                     setDocumentation={(newContent) => {
//                       setEditableContent(newContent);
//                       setDocVersions((prev) => ({
//                         ...prev,
//                         [selectedVersion]: {
//                           ...prev[selectedVersion],
//                           content: newContent,
//                         },
//                       }));
//                     }}
//                   />
//                 </div>
//               )}

//               <div className={`chat-slide-wrapper ${showChat ? "open" : "closed"}`}>
//                 <ChatInterface
//                   messages={chatMessages}
//                   onChatSubmit={handleChatSubmit}
//                   chatLoading={isChatLoading}
//                 />
//               </div>

//               <button
//                 onClick={() => setShowChat(!showChat)}
//                 style={{
//                   margin: "1rem 0",
//                   padding: "0.4rem 1rem",
//                   background: "#e2e2e2",
//                   border: "1px solid #ccc",
//                   borderRadius: "6px",
//                   cursor: "pointer",
//                   fontWeight: "500",
//                 }}
//               >
//                 {showChat ? "Hide Chat" : "Show Chat"}
//               </button>
//             </>
//           )}

//           {!isProcessing && Object.keys(docVersions).length === 0 && (
//             <div className="placeholder">
//               <p>Enter your GitHub link and select your persona to generate documentation.</p>
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }

// export default App;



// import React, { useState, useEffect } from "react";
// import GithubLinkInput from "./components/GithubLinkInput";
// import PersonaSelector from "./components/PersonaSelector";
// import ChatInterface from "./components/ChatInterface";
// import ProcessingIndicator from "./components/ProcessingIndicator";
// import DocumentationPanel from "./components/DocumentationPanel";
// import "./App.css";
// import logo from "./assets/logo.png";
// import DocDiffViewer from "./components/DocDiffViewer";


// function App() {
//   const [githubLink, setGithubLink] = useState("");
//   const [persona, setPersona] = useState("intermediate");
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [chatMessages, setChatMessages] = useState([]);
//   const [isChatLoading, setIsChatLoading] = useState(false);
//   const [branches, setBranches] = useState([]);
//   const [selectedBranch, setSelectedBranch] = useState("");
//   const [showChat, setShowChat] = useState(true);
//   const [showDiff, setShowDiff] = useState(false);

//   const [docVersions, setDocVersions] = useState({});
//   const [selectedVersion, setSelectedVersion] = useState("");
//   const [editableContent, setEditableContent] = useState("");

//   const handleGenerateDocs = async () => {
//     if (!githubLink.trim()) return;
//     setChatMessages([]);
//     setIsProcessing(true);

//     try {
//       const response = await fetch("http://localhost:5000/generate-docs", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           githubLink: githubLink.trim(),
//           persona,
//           branch: selectedBranch,
//         }),
//       });

//       const data = await response.json();
//       const baseDoc = data.gpt_summary || "No documentation generated.";
//       const initialVersion = {
//         Original: { content: baseDoc, label: "Original version" },
//       };

//       setDocVersions(initialVersion);
//       setSelectedVersion("Original");
//       setEditableContent(baseDoc);

//       if (data.branches?.length > 0) {
//         setBranches(data.branches);
//         setSelectedBranch(data.branches[0]);
//       }
//     } catch (error) {
//       console.error("Documentation generation failed:", error);
//       setDocVersions({
//         Original: {
//           content: "Error: Could not generate documentation.",
//           label: "Generation Error",
//         },
//       });
//       setSelectedVersion("Original");
//       setEditableContent("Error: Could not generate documentation.");
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const handleChatSubmit = async (message) => {
//     if (!message.trim()) return;
  
//     const newMessages = [...chatMessages, { sender: "user", text: message }];
//     setChatMessages(newMessages);
//     setIsChatLoading(true);
  
//     try {
//       const response = await fetch("http://localhost:5000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           githubLink,
//           persona,
//           documentation: docVersions[selectedVersion].content,
//           userMessage: message,
//         }),
//       });
  
//       const data = await response.json();
//       const delta = data.chatResponse || "No response received.";
  
//       // Merge the current version's content with new additions
//       const base = docVersions[selectedVersion]?.content || "";
//       const merged = `${base.trim()}\n\n### 🔄 User Refinement:\n${delta.trim()}`;
  
//       const versionNumber = Object.keys(docVersions).length;
//       const versionName = `Version ${versionNumber}`;
  
//       const userLabel = prompt("📌 Add a label for this refined version:");
//       const finalLabel = userLabel?.trim() || "Refinement";
  
//       // Save the full merged version
//       setDocVersions((prev) => ({
//         ...prev,
//         [versionName]: {
//           content: merged,
//           label: finalLabel,
//         },
//       }));
  
//       setSelectedVersion(versionName);
  
//       setChatMessages((prev) => [
//         ...prev,
//         {
//           sender: "system",
//           text: `📄 A new refined version has been added as "${versionName} – ${finalLabel}".`,
//           isMarkdown: false,
//         },
//       ]);
//     } catch (error) {
//       console.error("Error in chat interaction:", error);
//       setChatMessages((prev) => [
//         ...prev,
//         { sender: "system", text: "Error processing request.", isMarkdown: true },
//       ]);
//     } finally {
//       setIsChatLoading(false);
//     }
//   };



//   <button
//   onClick={() => setShowDiff(!showDiff)}
//   style={{
//     padding: "0.4rem 1rem",
//     marginBottom: "1rem",
//     background: "#f0f0f0",
//     border: "1px solid #ccc",
//     borderRadius: "6px",
//     cursor: "pointer"
//   }}
// >
//   {showDiff ? "Hide Comparison" : "Compare with Original"}
// </button>

//   {showDiff && selectedVersion !== "Original" && (

    
//     <DocDiffViewer
//       original={docVersions["Original"].content}
//       edited={docVersions[selectedVersion].content}
//   />
//   )}

//   const handleVersionChange = (newVersion) => {
//     // Save current edit before switching
//     setDocVersions((prev) => ({
//       ...prev,
//       [selectedVersion]: {
//         ...prev[selectedVersion],
//         content: editableContent,
//       },
//     }));

//     setSelectedVersion(newVersion);
//     setEditableContent(docVersions[newVersion]?.content || "");
//   };

//   // Sync content on mount of selectedVersion
//   useEffect(() => {
//     if (selectedVersion && docVersions[selectedVersion]) {
//       setEditableContent(docVersions[selectedVersion].content);
//     }
//   }, [selectedVersion]);

//   return (
//     <div className={isProcessing ? "app dark-mode" : "app"}>
//       <header className="app-header">
//         <img src={logo} alt="DocuGen Logo" className="logo" />
//         <h1>Documentation Generator</h1>
//       </header>

//       <div className="app-body">
//         <aside className="sidebar">
//           <GithubLinkInput githubLink={githubLink} setGithubLink={setGithubLink} />
//           <PersonaSelector
//             persona={persona}
//             setPersona={setPersona}
//             branches={branches}
//             selectedBranch={selectedBranch}
//             setSelectedBranch={setSelectedBranch}
//           />
//           <button
//             className="generate-docs-btn"
//             onClick={handleGenerateDocs}
//             disabled={isProcessing}
//           >
//             {isProcessing ? "Generating..." : "Generate Docs"}
//           </button>
//         </aside>

//         <main className="main-panel">
//           {isProcessing && <ProcessingIndicator />}

//           {!isProcessing && Object.keys(docVersions).length > 0 && (
//             <>
//               <div className="version-dropdown-wrapper">
//                 <label htmlFor="version-select"><strong>View Version:</strong></label>{" "}
//                 <select
//                   id="version-select"
//                   value={selectedVersion}
//                   onChange={(e) => handleVersionChange(e.target.value)}
//                   style={{ marginTop: "0.5rem", padding: "0.4rem", borderRadius: "4px" }}
//                 >
//                   {Object.entries(docVersions).map(([versionName, { label }]) => (
//                     <option key={versionName} value={versionName}>
//                       {versionName} – {label}
//                     </option>
//                   ))}
//                 </select>

//                 {selectedVersion !== "Original" && (
//   <div style={{ marginTop: "0.5rem", display: "flex", gap: "1rem" }}>
//     <button
//       onClick={() => {
//         const newLabel = prompt("✏️ Rename this version:");
//         if (newLabel?.trim()) {
//           setDocVersions((prev) => ({
//             ...prev,
//             [selectedVersion]: {
//               ...prev[selectedVersion],
//               label: newLabel.trim(),
//             },
//           }));
//         }
//       }}
//     >
//       ✏️ Rename
//     </button>

//     <button
//       onClick={() => {
//         const confirmed = window.confirm(`Delete "${selectedVersion}"?`);
//         if (confirmed) {
//           setDocVersions((prev) => {
//             const updated = { ...prev };
//             delete updated[selectedVersion];
//             const fallback = Object.keys(updated)[0] || "";
//             setSelectedVersion(fallback);
//             return updated;
//           });
//         }
//       }}
//     >
//       🗑️ Delete
//     </button>
//   </div>
// )}

//               </div>

//               <div className={`doc-container ${!showChat ? "full-height" : ""}`}>
//                 <DocumentationPanel
//                   documentation={editableContent}
//                   setDocumentation={(newContent) => {
//                     setEditableContent(newContent);
//                     setDocVersions((prev) => ({
//                       ...prev,
//                       [selectedVersion]: {
//                         ...prev[selectedVersion],
//                         content: newContent,
//                       },
//                     }));
//                   }}
//                 />
//               </div>

//               <div className={`chat-slide-wrapper ${showChat ? "open" : "closed"}`}>
//                 <ChatInterface
//                   messages={chatMessages}
//                   onChatSubmit={handleChatSubmit}
//                   chatLoading={isChatLoading}
//                 />
//               </div>

//               <button
//                 onClick={() => setShowChat(!showChat)}
//                 style={{
//                   margin: "1rem 0",
//                   padding: "0.4rem 1rem",
//                   background: "#e2e2e2",
//                   border: "1px solid #ccc",
//                   borderRadius: "6px",
//                   cursor: "pointer",
//                   fontWeight: "500",
//                 }}
//               >
//                 {showChat ? "Hide Chat" : "Show Chat"}
//               </button>
//             </>
//           )}

//           {!isProcessing && Object.keys(docVersions).length === 0 && (
//             <div className="placeholder">
//               <p>Enter your GitHub link and select your persona to generate documentation.</p>
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }

// export default App;













