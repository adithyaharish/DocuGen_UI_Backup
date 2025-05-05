
import React from "react";
import { diffLines } from "diff";
import ReactMarkdown from "react-markdown";
import "./DocDiffViewer.css";

const DocDiffViewer = ({ original, edited }) => {
  const diff = diffLines(original, edited);

  return (
    <div className="diff-table">
      <div className="diff-header">
        <div>Original</div>
        <div>Edited</div>
      </div>
      {diff.map((part, idx) => {
        if (part.added) {
          return (
            <div key={idx} className="diff-row">
              <div className="diff-cell empty"></div>
              <div className="diff-cell added">
                <ReactMarkdown>{part.value}</ReactMarkdown>
              </div>
            </div>
          );
        }
        if (part.removed) {
          return (
            <div key={idx} className="diff-row">
              <div className="diff-cell removed">
                <ReactMarkdown>{part.value}</ReactMarkdown>
              </div>
              <div className="diff-cell empty"></div>
            </div>
          );
        }
        return (
          <div key={idx} className="diff-row">
            <div className="diff-cell">
              <ReactMarkdown>{part.value}</ReactMarkdown>
            </div>
            <div className="diff-cell">
              <ReactMarkdown>{part.value}</ReactMarkdown>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DocDiffViewer;








// import React from "react";
// import { diffLines } from "diff";



// const DocDiffViewer = ({ original, edited }) => {
//   const diff = diffLines(original, edited);

//   return (
//     <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace" }}>
//       <thead>
//         <tr>
//           <th style={{ width: "50%", border: "1px solid #ccc" }}>Original</th>
//           <th style={{ width: "50%", border: "1px solid #ccc" }}>Edited</th>
//         </tr>
//       </thead>
//       <tbody>
//         {diff.map((part, idx) => {
//           if (part.added) {
//             return (
//               <tr key={idx}>
//                 <td style={{ border: "1px solid #ccc" }}></td>
//                 <td style={{ backgroundColor: "#eaffea", border: "1px solid #ccc" }}>{part.value}</td>
//               </tr>
//             );
//           }
//           if (part.removed) {
//             return (
//               <tr key={idx}>
//                 <td style={{ backgroundColor: "#ffecec", border: "1px solid #ccc" }}>{part.value}</td>
//                 <td style={{ border: "1px solid #ccc" }}></td>
//               </tr>
//             );
//           }
//           return (
//             <tr key={idx}>
//               <td style={{ border: "1px solid #ccc" }}>{part.value}</td>
//               <td style={{ border: "1px solid #ccc" }}>{part.value}</td>
//             </tr>
//           );
//         })}
//       </tbody>
//     </table>
//   );
// };

// export default DocDiffViewer;
