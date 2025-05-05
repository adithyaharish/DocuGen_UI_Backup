import React, { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function BranchCompareUI({ baseBranch, targetBranch, githubLink, onClose }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const response = await fetch("/compare-branches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            githubUrl: githubLink,
            base: baseBranch,
            head: targetBranch
          })
        });

        const data = await response.json();
        setResult(data.files || []);
      } catch (error) {
        console.error("Branch comparison failed:", error);
        setResult([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [baseBranch, targetBranch, githubLink]);

  if (loading) return <p style={{ margin: "2rem" }}>🔄 Loading comparison...</p>;

  return (
    <div style={{
      padding: "1.5rem",
      backgroundColor: "#fff",
      borderRadius: "10px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      height: "100%",
      maxHeight: "calc(100vh - 100px)",
      overflowY: "auto"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ marginBottom: "1rem" }}>📊 Comparison: <strong>{baseBranch}</strong> ⟶ <strong>{targetBranch}</strong></h2>
        <button onClick={onClose} style={{ backgroundColor: "#d9534f", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "5px", height: "fit-content" }}>Close</button>
      </div>

      {result.length === 0 ? (
        <p>No differences found or comparison failed.</p>
      ) : (
        result.map((file, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9"
            }}
          >
            <h4 style={{ margin: "0 0 0.5rem" }}>📄 {file.filename} — <span style={{ textTransform: "capitalize" }}>{file.status}</span></h4>
            <p style={{ margin: "0.2rem 0" }}>➕ Additions: <strong>{file.additions}</strong> | ➖ Deletions: <strong>{file.deletions}</strong> | 🔁 Changes: <strong>{file.changes}</strong></p>
            {file.blob_url && (
              <p style={{ margin: "0.2rem 0" }}>
                🔗 <a href={file.blob_url} target="_blank" rel="noopener noreferrer">View on GitHub</a>
              </p>
            )}
            {file.patch && (
              <details style={{ marginTop: "0.5rem" }}>
                <summary style={{ cursor: "pointer", color: "#007acc" }}>Show Diff</summary>
                <SyntaxHighlighter language="diff" style={oneDark} customStyle={{ marginTop: "0.5rem" }}>
                  {file.patch}
                </SyntaxHighlighter>
              </details>
            )}
          </div>
        ))
      )}
    </div>
  );
}
