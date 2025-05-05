import React, { useState, useEffect } from "react";
import "./VersionLabelModal.css";

const VersionLabelModal = ({ mode = "create", defaultLabel = "", onSubmit, onCancel }) => {
  const [label, setLabel] = useState(defaultLabel || "");

  useEffect(() => {
    setLabel(defaultLabel || "");
  }, [defaultLabel]);

  const isDeleteMode = mode === "delete";
  const isRenameMode = mode === "rename";
  const isCreateMode = mode === "create";

  const handleSubmit = () => {
    onSubmit(label.trim());
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        {isDeleteMode ? (
          <>
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete <strong>{defaultLabel}</strong>?
            </p>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={() => onSubmit()}>
                Yes, Delete
              </button>
              <button className="cancel-btn" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>{isRenameMode ? "Rename Version" : "Label New Version"}</h3>
            <input
              type="text"
              placeholder="Enter label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={handleSubmit} disabled={!label.trim()}>
                {isRenameMode ? "Rename" : "Create"}
              </button>
              <button className="cancel-btn" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VersionLabelModal;
