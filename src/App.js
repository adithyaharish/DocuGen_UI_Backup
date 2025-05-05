import React, { useState, useEffect } from "react";
import GithubLinkInput from "./components/GithubLinkInput";
import PersonaSelector from "./components/PersonaSelector";
import ChatInterface from "./components/ChatInterface";
import ProcessingIndicator from "./components/ProcessingIndicator";
import DocumentationPanel from "./components/DocumentationPanel";
import DocDiffViewer from "./components/DocDiffViewer";
import BranchCompareUI from "./components/BranchCompareUI";
import VersionLabelModal from "./components/VersionLabelModal";
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
  const [showLabelModal, setShowLabelModal] = useState(false);

  const [modalMode, setModalMode] = useState("create"); // "create" | "rename" | "delete"
  const [pendingDelta, setPendingDelta] = useState("");
  const [renameTarget, setRenameTarget] = useState("");
  const [deleteTarget, setDeleteTarget] = useState("");

  const [docVersions, setDocVersions] = useState({});
  const [selectedVersion, setSelectedVersion] = useState("");
  const [editableContent, setEditableContent] = useState("");

  const [baseBranch, setBaseBranch] = useState("");
  const [targetBranch, setTargetBranch] = useState("");
    const [showBranchCompare, setShowBranchCompare] = useState(false);
  const [showcomparebranches, setShowCompareBranches] = useState(false);

  const handleGenerateDocs = async () => {
    if (!githubLink.trim()) return;
    setIsProcessing(true);
    setShowCompareBranches(true);
    setChatMessages([]);

    try {
      const response = await fetch("http://localhost:5000/generate-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubLink, persona, branch: selectedBranch }),
      });

      const data = await response.json();
      const baseDoc = data.gpt_summary || "No documentation generated.";
      setDocVersions({
        Original: { content: baseDoc, label: "Original version" },
      });
      setSelectedVersion("Original");
      setEditableContent(baseDoc);

      if (data.branches?.length) {
        setBranches(data.branches);
        setSelectedBranch(data.branches[0]);
      }
    } catch (err) {
      console.error(err);
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
    setChatMessages([...chatMessages, { sender: "user", text: message }]);
    setIsChatLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubLink,
          persona,
          documentation: docVersions[selectedVersion]?.content,
          userMessage: message,
        }),
      });

      const data = await response.json();
      const delta = data.chatResponse || "No response received.";
      const merged = insertIntoRelevantSection(docVersions[selectedVersion]?.content || "", delta);

      setPendingDelta({ delta: merged });
      setModalMode("create");
      setShowLabelModal(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleVersionChange = (v) => {
    setDocVersions((prev) => ({
      ...prev,
      [selectedVersion]: { ...prev[selectedVersion], content: editableContent },
    }));
    setSelectedVersion(v);
    setEditableContent(docVersions[v]?.content || "");
  };

  const handleRename = (version) => {
    setModalMode("rename");
    setRenameTarget(version);
    setShowLabelModal(true);
  };

  const handleDelete = (version) => {
    setModalMode("delete");
    setDeleteTarget(version);
    setShowLabelModal(true);
  };

  const handleModalSubmit = (label) => {
    if (modalMode === "rename" && renameTarget) {
      setDocVersions((prev) => ({
        ...prev,
        [renameTarget]: {
          ...prev[renameTarget],
          label,
        },
      }));
      setRenameTarget("");
    } else if (modalMode === "create") {
      const versionName = `Version ${Object.keys(docVersions).length}`;
      setDocVersions((prev) => ({
        ...prev,
        [versionName]: {
          content: pendingDelta.delta,
          label,
        },
      }));
      setSelectedVersion(versionName);
      setPendingDelta("");
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "system",
          text: `📄 A new version "${versionName}" was created.`,
          isMarkdown: false,
        },
      ]);
    } else if (modalMode === "delete" && deleteTarget) {
      setDocVersions((prev) => {
        const updated = { ...prev };
        delete updated[deleteTarget];
        const fallback = Object.keys(updated)[0] || "";
        setSelectedVersion(fallback);
        return updated;
      });
      setDeleteTarget("");
    }

    setShowLabelModal(false);
    setModalMode("create");
  };

  useEffect(() => {
    if (selectedVersion && docVersions[selectedVersion]) {
      setEditableContent(docVersions[selectedVersion].content);
    }
  }, [selectedVersion]);

  return (
    <div className={isProcessing ? "app" : "app"}>
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
          <button className="generate-docs-btn" onClick={handleGenerateDocs} disabled={isProcessing}>
            {isProcessing ? "Generating..." : "Generate Docs"}
          </button>

          {showcomparebranches && (
          <div className="compare-branches-block">
            <label>Base Branch:</label>
            <select value={baseBranch} onChange={(e) => setBaseBranch(e.target.value)}>
              <option value="">Select</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>

            <label>Target Branch:</label>
            <select value={targetBranch} onChange={(e) => setTargetBranch(e.target.value)}>
              <option value="">Select</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>

            <button
              className="generate-docs-btn"
              disabled={!baseBranch || !targetBranch}
              onClick={() => setShowBranchCompare(true)}
            >
              Compare
            </button>
          </div>
          )}
        </aside>

        <main className="main-panel">
          {isProcessing && <ProcessingIndicator />}
          {showBranchCompare ? (
            <BranchCompareUI
              baseBranch={baseBranch}
              targetBranch={targetBranch}
              githubLink={githubLink}
              onClose={() => setShowBranchCompare(false)}
            />
          ) : (
            <>
              {Object.keys(docVersions).length > 0 && (
                <>
                  <div className="version-dropdown-wrapper">
                    <label><strong>View Version:</strong></label>
                    <select
                      value={selectedVersion}
                      onChange={(e) => handleVersionChange(e.target.value)}
                      style={{ marginTop: "0.5rem", padding: "0.4rem", borderRadius: "4px" }}
                    >
                      {Object.entries(docVersions).map(([v, { label }]) => (
                        <option key={v} value={v}>{v} – {label}</option>
                      ))}
                    </select>

                    {selectedVersion !== "Original" && (
                      <div className="version-actions">
                        <button className="rename-btn" onClick={() => handleRename(selectedVersion)}>✏️ Rename</button>
                        <button className="delete-btn" onClick={() => handleDelete(selectedVersion)}>🗑️ Delete</button>
                        <button className="compare-btn" onClick={() => setShowDiff(!showDiff)}>
                          {showDiff ? "Hide Comparison" : "Compare with Original"}
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
                        githubLink = {githubLink}
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
            </>
          )}
        </main>
      </div>

      {showLabelModal && (
        <VersionLabelModal
          mode={modalMode}
          defaultLabel={modalMode === "rename" ? docVersions[renameTarget]?.label : ""}
          onSubmit={handleModalSubmit}
          onCancel={() => {
            setShowLabelModal(false);
            setModalMode("create");
            setRenameTarget("");
            setDeleteTarget("");
            setPendingDelta("");
          }}
        />
      )}
    </div>
  );
}

export default App;