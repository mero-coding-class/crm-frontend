import React, { useState, useCallback } from "react";
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const FileUploader = ({
  onFileUploadSuccess,
  token,
  label = "Upload Files",
  multiple = true,
  accept = "*/*",
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles((prev) => (multiple ? [...prev, ...files] : files));
  };

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(false);
      const files = Array.from(event.dataTransfer.files);
      setSelectedFiles((prev) => (multiple ? [...prev, ...files] : files));
    },
    [multiple]
  );

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadError("Please select files to upload.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      for (const file of selectedFiles) {
        // TODO: Implement actual file upload API call
        // For now, just simulate upload
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("File would be uploaded:", file.name);
      }
      setUploadSuccess("Files uploaded successfully!");
      setSelectedFiles([]); // Clear selected files on success
      if (onFileUploadSuccess) {
        onFileUploadSuccess(); // Callback to parent component
      }
    } catch (error) {
      console.error("File upload failed:", error);
      setUploadError(error.message || "Failed to upload files.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-4 p-4 border border-dashed border-gray-300 rounded-md bg-white">
      {" "}
      {/* Replaced card-like styling */}
      <label
        htmlFor="file-upload"
        className={`flex flex-col items-center justify-center p-6 cursor-pointer rounded-md transition-all duration-200
          ${
            isDragging
              ? "bg-blue-100 border-blue-400"
              : "bg-gray-50 hover:bg-gray-100 border-gray-300"
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CloudArrowUpIcon className="h-10 w-10 text-gray-400 mb-2" />
        <p className="text-gray-600 mb-1">
          Drag & drop files here, or{" "}
          <span className="text-blue-600 font-medium">browse</span>
        </p>
        <p className="text-xs text-gray-500">Max file size: 10MB</p>
        <input
          id="file-upload"
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
      {selectedFiles.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Selected Files:
          </h3>
          <ul className="space-y-2">
            {selectedFiles.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
              >
                <div className="flex items-center">
                  <DocumentIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-800">{file.name}</span>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-gray-400 hover:text-red-500 ml-2"
                  aria-label={`Remove ${file.name}`}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`mt-4 w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {uploading ? "Uploading..." : "Upload Files"}
          </button>
        </div>
      )}
      {uploadSuccess && (
        <p className="mt-2 text-green-600 text-sm">{uploadSuccess}</p>
      )}
      {uploadError && (
        <p className="mt-2 text-red-600 text-sm">{uploadError}</p>
      )}
    </div>
  );
};

export default FileUploader;