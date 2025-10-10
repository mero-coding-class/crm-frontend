import React from "react";

export default function PaymentSection({ formData, setField }) {
  return (
    <>
      <div className="md:col-span-3 text-lg font-semibold text-gray-800 border-t pt-4">Payment Information</div>
      <div>
        <label htmlFor="first_installment" className="block text-sm font-medium text-gray-700">
          First Installment Amount
        </label>
        <input
          type="number"
          id="first_installment"
          name="first_installment"
          value={formData.first_installment}
          onChange={(e) => setField("first_installment", e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter amount"
          min="0"
          step="0.01"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">First Invoice (PDF/Image)</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <input
            type="file"
            id="first_invoice"
            name="first_invoice"
            onChange={(e) => {
              const file = e.target.files[0];
              setField("first_invoice", file);
            }}
            accept=".pdf,.jpg,.jpeg,.png,.gif"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {formData.first_invoice && (
            <div className="mt-2 text-sm text-green-600">Selected: {formData.first_invoice.name}</div>
          )}
          <p className="mt-1 text-xs text-gray-500">Upload PDF or image files (JPG, PNG, GIF)</p>
        </div>
      </div>
    </>
  );
}
