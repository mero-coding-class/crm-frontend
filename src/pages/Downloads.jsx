import React, { useMemo, useState } from "react";
import { exportsStore } from "../services/exportsStore";

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function downloadItem(item) {
  try {
    const blob = new Blob([item.content], { type: item.mimeType || "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.fileName || "download.txt";
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Failed to download item:", e);
    window.alert("Failed to download file.");
  }
}

const Downloads = () => {
  const [itemsVersion, setItemsVersion] = useState(0);
  const items = useMemo(() => exportsStore.list(), [itemsVersion]);

  const handleDelete = (id) => {
    exportsStore.remove(id);
    setItemsVersion((v) => v + 1);
  };

  const handleClear = () => {
    if (!window.confirm("Clear all saved exports?")) return;
    exportsStore.clear();
    setItemsVersion((v) => v + 1);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Downloads</h1>
        {items.length > 0 && (
          <button
            onClick={handleClear}
            className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded shadow p-6 text-center text-gray-600">
          No saved exports yet. Export leads or enrollments to see them here.
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exported By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.fileName || "download.csv"}</div>
                    <div className="text-xs text-gray-500">{item.mimeType} • {item.size || 0} bytes</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.source || "Unknown"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.exportedBy || "unknown"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => downloadItem(item)}
                      className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1.5 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Downloads;
