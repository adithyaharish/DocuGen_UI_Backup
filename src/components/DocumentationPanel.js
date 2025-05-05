
// import React, { useState, useRef  } from "react";
// import remarkGfm from "remark-gfm";
// import rehypeRaw from "rehype-raw";
// import { jsPDF } from "jspdf";
// import html2canvas from "html2canvas";
// import { FaCopy, FaCheck, FaDownload, FaEdit, FaEye } from "react-icons/fa";
// import ReactMarkdown from "react-markdown";
// import "./DocumentationPanel.css";
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// const DocumentationPanel = ({ documentation, setDocumentation, branches }) => {
//   const [copied, setCopied] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
  
//   const [showSetup, setShowSetup] = useState(false);
//   const [setupContent, setSetupContent] = useState("");
//   const [isLoadingSetup, setIsLoadingSetup] = useState(false);

//   const downloadPDF = () => {
//     const input = document.getElementById("doc-content");
//     const originalStyle = input.style.cssText;
//     input.style.overflow = "visible";
//     input.style.maxHeight = "none";
//     html2canvas(input).then((canvas) => {
//       const imgData = canvas.toDataURL("image/png");
//       const pdf = new jsPDF("p", "pt", "a4");
//       const imgWidth = pdf.internal.pageSize.getWidth();
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;
//       pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
//       pdf.save("documentation.pdf");
//       input.style.cssText = originalStyle;
//     });
//   };

//   const exportText = (format) => {
//     let blob;
//     switch (format) {
//       case "txt":
//         blob = new Blob([documentation], { type: "text/plain" });
//         break;
//       case "json":
//         blob = new Blob([JSON.stringify({ content: documentation }, null, 2)], {
//           type: "application/json",
//         });
//         break;
//       case "md":
//         blob = new Blob([documentation], { type: "text/markdown" });
//         break;
//       default:
//         return;
//     }

//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = `documentation.${format}`;
//     link.click();
//     URL.revokeObjectURL(url);
//   };

//   const copyToClipboard = () => {
//     navigator.clipboard
//       .writeText(documentation)
//       .then(() => {
//         setCopied(true);
//         setTimeout(() => setCopied(false), 2000);
//       })
//       .catch((err) => {
//         console.error("Failed to copy text: ", err);
//       });
//   };


//   const handleSetupGuide = async () => {
//     setIsLoadingSetup(true);
//     try {
//       const response = await fetch("http://localhost:5000/setup-guide", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ documentation })
//       });
  
//       if (!response.ok) throw new Error(`HTTP ${response.status}`);
//       const data = await response.json();
  
//       if (!data.setupGuide) throw new Error("Missing 'setupGuide' in response");
  
//       setSetupContent(data.setupGuide);
//     } catch (err) {
//       console.error("Setup Guide fetch failed:", err);
//       setSetupContent("⚠️ Failed to load setup guide. Please try again later.");
//     } finally {
//       setShowSetup(true);
//       setIsLoadingSetup(false);
//     }
//   };

  
//   return (

//     <div className="documentation-panel-wrapper" style={{ position: "relative" }}>
//     {isLoadingSetup && (
//       <div className="setup-loading-overlay">
//         <div className="spinner" />
//       </div>
//     )}

//     <div className={`documentation-panel ${isLoadingSetup ? "blurred" : ""}`}>

// {showSetup ? (
//           <div>
//             <div className="doc-header">
//               <h2>Setup Guide</h2>
//               <button className="close-btn" onClick={() => setShowSetup(false)}>❌</button>
//             </div>
//             <div className="doc-content">
//             <ReactMarkdown
//                 remarkPlugins={[remarkGfm]}
//                 rehypePlugins={[rehypeRaw]}
//                 components={{
//                   code({ node, inline, className, children, ...props }) {
//                     const match = /language-(\w+)/.exec(className || '');
//                     return !inline ? (
//                       <SyntaxHighlighter
//                         style={oneDark}
//                         language={match?.[1] || 'bash'}
//                         PreTag="div"
//                         {...props}
//                       >
//                         {String(children).replace(/\n$/, '')}
//                       </SyntaxHighlighter>
//                     ) : (
//                       <code className={className} {...props}>
//                         {children}
//                       </code>
//                     );
//                   }
//                 }}
//               >
//                 {setupContent}
//               </ReactMarkdown>
//             </div>
//           </div>
//         ) : (
//           <>

//       <div className="doc-header">
//         <h2>Generated Documentation</h2>
//         <div className="button-group">
//           <button className="copy-btn" onClick={copyToClipboard}>
//             {copied ? (
//               <>
//                 <FaCheck /> Copied!
//               </>
//             ) : (
//               <>
//                 <FaCopy /> Copy All
//               </>
//             )}
//           </button>
//           <button className="download-btn" onClick={downloadPDF}>
//             <FaDownload /> PDF
//           </button>
//           <button onClick={() => exportText("txt")} className="download-btn">
//             .TXT
//           </button>
         
//           <button onClick={() => exportText("json")} className="download-btn">
//             .JSON
//           </button>
//           <button
//             onClick={() => setIsEditing((prev) => !prev)}
//             className="download-btn"
//             style={{ backgroundColor: "#f2c94c" }}
//           >
//             {isEditing ? <FaEye /> : <FaEdit />} {isEditing ? "Preview" : "Edit"}
//           </button>

//           <button className="download-btn" onClick={handleSetupGuide}>
//                   Setup Guide
//                 </button>

//         </div>
//       </div>

//       <div className="doc-content" id="doc-content">
//         {isEditing ? (
//           <textarea
//             value={documentation}
//             onChange={(e) => setDocumentation(e.target.value)}
//             style={{
//               width: "100%",
//               height: "60vh",
//               fontFamily: "monospace",
//               fontSize: "1rem",
//               padding: "1rem",
//               border: "1px solid #ccc",
//               borderRadius: "6px",
//               resize: "vertical",
//             }}
//           />
//         ) : (
//           <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
//             {documentation}
//           </ReactMarkdown>
//         )}
//       </div>

//       </>
//         )}
//     </div>
//     </div>
//   );
// };

// export default DocumentationPanel;


// // import React, { useState } from "react";
// // import ReactMarkdown from "react-markdown";
// // import remarkGfm from "remark-gfm";
// // import rehypeRaw from "rehype-raw";
// // import { jsPDF } from "jspdf";
// // import html2canvas from "html2canvas";
// // import { FaCopy, FaCheck } from "react-icons/fa"; // Importing copy and check icons
// // import "./DocumentationPanel.css";

// // const DocumentationPanel = ({ documentation, branches }) => {
// //   console.log("Received branches:", branches)
// //   const [copied, setCopied] = useState(false);

// //   // Function to download content as PDF
// //   const downloadPDF = () => {
// //     const input = document.getElementById("doc-content");
// //     const originalStyle = input.style.cssText; // Store current styles
// //     input.style.overflow = "visible"; // Ensure overflow is visible
// //     input.style.maxHeight = "none"; // Remove max-height restriction
// //     html2canvas(input).then((canvas) => {
// //       const imgData = canvas.toDataURL("image/png");
// //       const pdf = new jsPDF("p", "pt", "a4");
// //       const pdfWidth = pdf.internal.pageSize.getWidth();
// //       const pdfHeight = pdf.internal.pageSize.getHeight();
// //       const imgWidth = pdfWidth;
// //       const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
// //       pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
// //       pdf.save("documentation.pdf");
// //       input.style.cssText = originalStyle;
// //     });
// //   };

// //   // Function to copy documentation text to clipboard with visual feedback
// //   const copyToClipboard = () => {
// //     navigator.clipboard.writeText(documentation)
// //       .then(() => {
// //         setCopied(true);
// //         setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
// //       })
// //       .catch((err) => {
// //         console.error("Failed to copy text: ", err);
// //       });
// //   };

// //   return (
// //     <div className="documentation-panel">
// //       <div className="doc-header">
// //         <h2>Generated Documentation</h2>
// //         <div className="button-group">
// //           <button className="download-btn" onClick={downloadPDF}>
// //             Download
// //           </button>
// //           <button className="copy-btn" onClick={copyToClipboard}>
// //             {copied ? (
// //               <>
// //                 <FaCheck style={{ marginRight: "8px" }} />
// //                 Copied!
// //               </>
// //             ) : (
// //               <>
// //                 <FaCopy style={{ marginRight: "8px" }} />
// //                 Copy All
// //               </>
// //             )}
// //           </button>
// //         </div>
// //       </div>
      
// //       {/* {branches && branches.length > 0 && (
// //         <div className="branch-list">
// //           <h3>Available Branches:</h3>
// //           <ul>
// //             {branches.map((branch) => (
// //               <li key={branch}>{branch}</li>
// //             ))}
// //           </ul>
// //         </div>
// //       )} */}

      
// //       <div className="doc-content" id="doc-content">
// //         <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
// //           {documentation}
// //         </ReactMarkdown>
// //       </div>
// //     </div>
// //   );
// // };

// // export default DocumentationPanel;

import React, { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { FaCopy, FaDownload, FaEdit, FaEye, FaCheck } from "react-icons/fa";
import TermPopup from "./TermPopup";
import "./DocumentationPanel.css";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const TERM_REGEX = /\b([A-Za-z_][A-Za-z0-9_]{2,}(?:\(\))?)\b/g;

const DocumentationPanel = ({ documentation, setDocumentation }) => {
  const containerRef = useRef(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [popupPos, setPopupPos] = useState(null);
  const [snippet, setSnippet] = useState("");
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupContent, setSetupContent] = useState("");
  const [isLoadingSetup, setIsLoadingSetup] = useState(false);

  const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "zh", label: "Chinese" },
    { code: "es", label: "Spanish" },
    { code: "fr", label: "French" },
    { code: "de", label: "German" }
  ];

  const [selectedLang, setSelectedLang] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [originalDoc, setOriginalDoc] = useState("");


  useEffect(() => {
    if (documentation && originalDoc === "") {
      setOriginalDoc(documentation);
    }
  }, [documentation]);
  
  // Term detection and markup logic
  useEffect(() => {
    if (isEditing || showSetup) return;

    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = marked.parse(documentation || "");

    container.querySelectorAll("code:not(pre > code)").forEach((el) => {
      el.innerHTML = el.textContent.replace(TERM_REGEX, (match, id) =>
        `<span class="clickable-term" data-term="${id}" title="Double-click for quick info">${match}</span>`
      );
    });

    const handleDoubleClick = (e) => {
      const span = e.target.closest(".clickable-term");
      if (!span) return;

      const wrapper = span.closest("p, li, pre, div");
      const wrapperText = wrapper?.innerText || span.innerText;
      const termText = span.innerText;
      
      let context = wrapperText;
      if (wrapperText.length > 300) {
        const idx = wrapperText.indexOf(termText);
        context = wrapperText.slice(
          Math.max(0, idx - 150),
          Math.min(wrapperText.length, idx + termText.length + 150)
        );
      }
      setSnippet(context);

      const rect = span.getBoundingClientRect();
      // setPopupPos({
      //   // top: rect.bottom + window.scrollY -220,
      //   // left: rect.left + window.scrollX-250
      // });
      setPopupPos({
        top: window.innerHeight / 2 - 250,
        left: window.innerWidth / 2 - 300
      });
      setSelectedTerm(span.dataset.term);
    };

    container.addEventListener("dblclick", handleDoubleClick);
    return () => container.removeEventListener("dblclick", handleDoubleClick);
  }, [documentation, isEditing, showSetup]);

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(documentation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Export as different formats
  const exportText = (format) => {
    const blob = new Blob([format === "json" 
      ? JSON.stringify({ content: documentation }, null, 2) 
      : documentation
    ], { type: {
      txt: "text/plain",
      json: "application/json",
      md: "text/markdown"
    }[format] });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `documentation.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download as PDF
  const downloadPDF = async () => {
    const input = containerRef.current;
    const originalStyle = input.style.cssText;
    input.style.overflow = "visible";
    input.style.maxHeight = "none";
    
    const canvas = await html2canvas(input, { scale: 2 });
    const pdf = new jsPDF("p", "pt", "a4");
    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(canvas, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save("documentation.pdf");
    input.style.cssText = originalStyle;
  };

  // Fetch setup guide
  const handleSetupGuide = async () => {
    setIsLoadingSetup(true);
    try {
      const response = await fetch("http://localhost:5000/setup-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentation })
      });
      const data = await response.json();
      setSetupContent(data.setupGuide || "No setup guide available");
      setShowSetup(true);
    } catch (error) {
      setSetupContent("⚠️ Failed to load setup guide");
      setShowSetup(true);
    } finally {
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

      {/* <div className={`documentation-panel ${isLoadingSetup ? "blurred" : ""}`}> */}
      <div className={`documentation-panel ${(isLoadingSetup || isTranslating) ? "blurred" : ""}`}>
        {showSetup ? (
          <div>
            <div className="doc-header">
              <h2>Setup Guide</h2>
              <button className="close-btn" onClick={() => setShowSetup(false)}>❌</button>
            </div>
            <div className="doc-content">
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
                  {copied ? <FaCheck /> : <FaCopy />} {copied ? "Copied!" : "Copy All"}
                </button>
                <div className="dropdown">
  <button className="download-btn dropdown-toggle">
    <FaDownload style={{ marginRight: "6px" }} /> Download
  </button>
  <div className="dropdown-menu">
    <button onClick={downloadPDF}>📄 PDF</button>
    <button onClick={() => exportText("txt")}>📄 TXT</button>
    <button onClick={() => exportText("json")}>📄 JSON</button>
  </div>
</div>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="download-btn"
                  style={{ backgroundColor: "#f2c94c" }}
                >
                  {isEditing ? <FaEye /> : <FaEdit />} {isEditing ? "Preview" : "Edit"}
                </button>
                <button className="download-btn" onClick={handleSetupGuide}>
                  Setup Guide
                </button>

       <select
  className="download-btn language-select"
  value={selectedLang}
  onChange={async (e) => {
    const newLang = e.target.value;
    setSelectedLang(newLang);

    if (newLang === "en") {
      setDocumentation(originalDoc); // 🔁 restore original
      return;
    }

    setIsTranslating(true);
    try {
      const response = await fetch("http://localhost:5000/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: originalDoc, targetLang: newLang }) // 👈 always translate from original
      });
      const data = await response.json();
      if (data.translation) {
        setDocumentation(data.translation);
      }
    } catch (error) {
      alert("❌ Translation failed");
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  }}
>
{LANGUAGES.map((lang) => (
    <option key={lang.code} value={lang.code}>
      {lang.label}
    </option>
  ))}
</select>
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
                <div ref={containerRef} className="documentation-content formatted-docs" />
              )}
            </div>
          </>
        )}
      </div>

      {selectedTerm && popupPos && (
        <>
          <div className="popup-overlay-lite" onClick={() => setSelectedTerm(null)} />
          <TermPopup
          
            term={selectedTerm}
            snippet={snippet}
            position={popupPos}
            onClose={() => setSelectedTerm(null)}
          />
        </>
      )}
        {isTranslating && (
    <div className="translation-spinner-overlay">
      <div className="spinner" />
      <div className="spinner-label">  Translating...</div>
    </div>
  )}
  
    </div>
  );
};

export default DocumentationPanel;