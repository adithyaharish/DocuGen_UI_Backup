
import React, { useState, useRef  } from "react";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { FaCopy, FaCheck, FaDownload, FaEdit, FaEye } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import "./DocumentationPanel.css";

const DocumentationPanel = ({ documentation, setDocumentation, branches }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [showSetup, setShowSetup] = useState(false);
  const [setupContent, setSetupContent] = useState("");
  const [isLoadingSetup, setIsLoadingSetup] = useState(false);

  const downloadPDF = () => {
    const input = document.getElementById("doc-content");
    const originalStyle = input.style.cssText;
    input.style.overflow = "visible";
    input.style.maxHeight = "none";
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save("documentation.pdf");
      input.style.cssText = originalStyle;
    });
  };

  const exportText = (format) => {
    let blob;
    switch (format) {
      case "txt":
        blob = new Blob([documentation], { type: "text/plain" });
        break;
      case "json":
        blob = new Blob([JSON.stringify({ content: documentation }, null, 2)], {
          type: "application/json",
        });
        break;
      case "md":
        blob = new Blob([documentation], { type: "text/markdown" });
        break;
      default:
        return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `documentation.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(documentation)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };


  const handleSetupGuide = async () => {
    setIsLoadingSetup(true);
    try {
      const response = await fetch("http://localhost:5000/setup-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentation })
      });
  
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
  
      if (!data.setupGuide) throw new Error("Missing 'setupGuide' in response");
  
      setSetupContent(data.setupGuide);
    } catch (err) {
      console.error("Setup Guide fetch failed:", err);
      setSetupContent("⚠️ Failed to load setup guide. Please try again later.");
    } finally {
      setShowSetup(true);
      setIsLoadingSetup(false);
    }
  };

  
  return (

    <div className="documentation-panel-wrapper" style={{ position: "relative" }}>
    {isLoadingSetup && (
      <div className="setup-loading-overlay">
        <div className="spinner" />
      </div>
    )}

    <div className={`documentation-panel ${isLoadingSetup ? "blurred" : ""}`}>

{showSetup ? (
          <div className="full-panel-popup">
            <div className="popup-header">
              <h2>Setup Guide</h2>
              <button className="close-btn" onClick={() => setShowSetup(false)}>❌</button>
            </div>
            <div className="popup-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {setupContent}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <>

      <div className="doc-header">
        <h2>Generated Documentation</h2>
        <div className="button-group">
          <button className="copy-btn" onClick={copyToClipboard}>
            {copied ? (
              <>
                <FaCheck /> Copied!
              </>
            ) : (
              <>
                <FaCopy /> Copy All
              </>
            )}
          </button>
          <button className="download-btn" onClick={downloadPDF}>
            <FaDownload /> PDF
          </button>
          <button onClick={() => exportText("txt")} className="download-btn">
            .TXT
          </button>
         
          <button onClick={() => exportText("json")} className="download-btn">
            .JSON
          </button>
          <button
            onClick={() => setIsEditing((prev) => !prev)}
            className="download-btn"
            style={{ backgroundColor: "#f2c94c" }}
          >
            {isEditing ? <FaEye /> : <FaEdit />} {isEditing ? "Preview" : "Edit"}
          </button>

          <button className="download-btn" onClick={handleSetupGuide}>
                  Setup Guide
                </button>

        </div>
      </div>

      <div className="doc-content" id="doc-content">
        {isEditing ? (
          <textarea
            value={documentation}
            onChange={(e) => setDocumentation(e.target.value)}
            style={{
              width: "100%",
              height: "60vh",
              fontFamily: "monospace",
              fontSize: "1rem",
              padding: "1rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
              resize: "vertical",
            }}
          />
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {documentation}
          </ReactMarkdown>
        )}
      </div>

      </>
        )}
    </div>
    </div>
  );
};

export default DocumentationPanel;


// import React, { useState } from "react";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import rehypeRaw from "rehype-raw";
// import { jsPDF } from "jspdf";
// import html2canvas from "html2canvas";
// import { FaCopy, FaCheck } from "react-icons/fa"; // Importing copy and check icons
// import "./DocumentationPanel.css";

// const DocumentationPanel = ({ documentation, branches }) => {
//   console.log("Received branches:", branches)
//   const [copied, setCopied] = useState(false);

//   // Function to download content as PDF
//   const downloadPDF = () => {
//     const input = document.getElementById("doc-content");
//     const originalStyle = input.style.cssText; // Store current styles
//     input.style.overflow = "visible"; // Ensure overflow is visible
//     input.style.maxHeight = "none"; // Remove max-height restriction
//     html2canvas(input).then((canvas) => {
//       const imgData = canvas.toDataURL("image/png");
//       const pdf = new jsPDF("p", "pt", "a4");
//       const pdfWidth = pdf.internal.pageSize.getWidth();
//       const pdfHeight = pdf.internal.pageSize.getHeight();
//       const imgWidth = pdfWidth;
//       const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
//       pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
//       pdf.save("documentation.pdf");
//       input.style.cssText = originalStyle;
//     });
//   };

//   // Function to copy documentation text to clipboard with visual feedback
//   const copyToClipboard = () => {
//     navigator.clipboard.writeText(documentation)
//       .then(() => {
//         setCopied(true);
//         setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
//       })
//       .catch((err) => {
//         console.error("Failed to copy text: ", err);
//       });
//   };

//   return (
//     <div className="documentation-panel">
//       <div className="doc-header">
//         <h2>Generated Documentation</h2>
//         <div className="button-group">
//           <button className="download-btn" onClick={downloadPDF}>
//             Download
//           </button>
//           <button className="copy-btn" onClick={copyToClipboard}>
//             {copied ? (
//               <>
//                 <FaCheck style={{ marginRight: "8px" }} />
//                 Copied!
//               </>
//             ) : (
//               <>
//                 <FaCopy style={{ marginRight: "8px" }} />
//                 Copy All
//               </>
//             )}
//           </button>
//         </div>
//       </div>
      
//       {/* {branches && branches.length > 0 && (
//         <div className="branch-list">
//           <h3>Available Branches:</h3>
//           <ul>
//             {branches.map((branch) => (
//               <li key={branch}>{branch}</li>
//             ))}
//           </ul>
//         </div>
//       )} */}

      
//       <div className="doc-content" id="doc-content">
//         <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
//           {documentation}
//         </ReactMarkdown>
//       </div>
//     </div>
//   );
// };

// export default DocumentationPanel;
