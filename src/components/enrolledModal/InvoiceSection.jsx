import React from "react";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";

const getFileNameFromUrl = (url) => {
  if (!url) return "";
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : url;
  } catch (e) {
    const parts = url.split("/");
    return parts.length > 0 ? parts[parts.length - 1] : url;
  }
};

export default function InvoiceSection({ formData, onSecondFile, onThirdFile }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Second Invoice</label>
        {formData.second_invoice_url ? (
          <div className="flex items-center gap-2 mt-1">
            <a href={formData.second_invoice_url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm truncate">
              {getFileNameFromUrl(formData.second_invoice_url)}
            </a>
            <a href={formData.second_invoice_url} target="_blank" rel="noreferrer" title="Download" className="text-gray-600 hover:text-gray-800">
              <DocumentArrowDownIcon className="h-5 w-5" />
            </a>
          </div>
        ) : (
          <p className="text-gray-500 text-sm mt-1">No second invoice</p>
        )}
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => onSecondFile(e.target.files?.[0] || null)}
          className="mt-2 block w-full text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Third Invoice</label>
        {formData.third_invoice_url ? (
          <div className="flex items-center gap-2 mt-1">
            <a href={formData.third_invoice_url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm truncate">
              {getFileNameFromUrl(formData.third_invoice_url)}
            </a>
            <a href={formData.third_invoice_url} target="_blank" rel="noreferrer" title="Download" className="text-gray-600 hover:text-gray-800">
              <DocumentArrowDownIcon className="h-5 w-5" />
            </a>
          </div>
        ) : (
          <p className="text-gray-500 text-sm mt-1">No third invoice</p>
        )}
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => onThirdFile(e.target.files?.[0] || null)}
          className="mt-2 block w-full text-sm"
        />
      </div>
    </div>
  );
}
