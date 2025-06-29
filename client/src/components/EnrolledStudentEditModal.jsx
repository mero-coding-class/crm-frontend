// src/components/EnrolledStudentEditModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, DocumentArrowDownIcon, TrashIcon } from "@heroicons/react/24/outline";
import { courseOptions } from '../constants/leadOptions';

const EnrolledStudentEditModal = ({ student, onClose, onSave }) => {
  // Initialize formData with ALL properties from the student prop
  // This ensures that even fields not directly editable in the modal
  // are retained and passed back.
  const [formData, setFormData] = useState({}); // Initialize as empty object first

  const modalRef = useRef(null);

  // Helper to format date to YYYY-MM-DD
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Populate form data when the student prop changes
  useEffect(() => {
    if (student) {
      // **Crucial Change:** Spread the entire student object
      // then override/set the specific fields the modal manages.
      setFormData({
        ...student, // This copies all existing fields (like addDate, status, etc.)
        studentName: student.studentName || '',
        parentsName: student.parentsName || '',
        email: student.email || '',
        phone: student.phone || '',
        course: student.course || '',
        totalPayment: student.totalPayment !== undefined && student.totalPayment !== null ? student.totalPayment : '',
        installment1: student.installment1 !== undefined && student.installment1 !== null ? student.installment1 : '',
        installment1Date: student.installment1Date || null,
        installment2: student.installment2 !== undefined && student.installment2 !== null ? student.installment2 : '',
        installment2Date: student.installment2Date || null,
        installment3: student.installment3 !== undefined && student.installment3 !== null ? student.installment3 : '',
        installment3Date: student.installment3Date || null,
        invoice: student.invoice ? [...student.invoice] : [], // Deep copy array
        remarks: student.remarks || ''
      });
    }
  }, [student]);

  // Handle outside click to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newState = { ...prev, [name]: value };

      // Logic to update installmentXDate when installmentX value changes
      if (name.startsWith('installment') && name.endsWith('Date') === false) { // Ensure it's an amount field
        const dateFieldName = `${name}Date`;
        // Convert current and previous values to numbers for comparison
        const currentValue = parseFloat(value);
        const previousValue = parseFloat(prev[name]);

        // Only update the date if the value is a number and has changed from its previous numeric value
        if (!isNaN(currentValue) && currentValue !== previousValue) {
            newState[dateFieldName] = formatDate(new Date()); // Set to current date
        } else if (value === '' && prev[name] !== '') { // If amount is cleared, clear the date
            newState[dateFieldName] = null;
        }
      }
      return newState;
    });
  };

  const handleInvoiceChange = (index, field, value) => {
    const updatedInvoices = formData.invoice.map((inv, i) =>
      i === index ? { ...inv, [field]: value } : inv
    );
    setFormData((prev) => ({ ...prev, invoice: updatedInvoices }));
  };

  const addInvoiceField = () => {
    setFormData((prev) => ({
      ...prev,
      invoice: [...prev.invoice, { name: '', url: '' }]
    }));
  };

  const removeInvoiceField = (index) => {
    setFormData((prev) => ({
      ...prev,
      invoice: prev.invoice.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ensure numeric values are numbers, not strings, and filter out empty invoice entries
    const savedData = {
      ...formData, // Spreading formData now includes ALL original fields + updated ones
      totalPayment: formData.totalPayment ? parseFloat(formData.totalPayment) : null,
      installment1: formData.installment1 ? parseFloat(formData.installment1) : null,
      installment2: formData.installment2 ? parseFloat(formData.installment2) : null,
      installment3: formData.installment3 ? parseFloat(formData.installment3) : null,
      // installmentXDate fields are already correctly managed in formData by handleChange
      invoice: formData.invoice.filter(inv => inv.name && inv.url)
    };
    onSave({ ...savedData, _id: student._id }); // Pass the _id back for identification
  };

  return (
    <div className="fixed inset-0 bg-gray-600/50 flex items-center justify-center z-50 overflow-y-auto p-4 animate-fade-in">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-auto my-8 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800">Edit Enrolled Student</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input fields for studentName, parentsName, email, phone, course, totalPayment, installment1, installment2, installment3, remarks, and invoice... */}
          {/* ... (Your existing input structure) ... */}

          <div>
            <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">Student Name</label>
            <input
              type="text"
              name="studentName"
              id="studentName"
              value={formData.studentName}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="parentsName" className="block text-sm font-medium text-gray-700">Parents' Name</label>
            <input
              type="text"
              name="parentsName"
              id="parentsName"
              value={formData.parentsName}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="course" className="block text-sm font-medium text-gray-700">Course</label>
            <select
              name="course"
              id="course"
              value={formData.course}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select Course</option>
              {courseOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 grid grid-cols-3 gap-4 border-t pt-4 mt-4">
            <div>
              <label htmlFor="totalPayment" className="block text-sm font-medium text-gray-700">Total Payment</label>
              <input
                type="number"
                name="totalPayment"
                id="totalPayment"
                value={formData.totalPayment}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="installment1" className="block text-sm font-medium text-gray-700">1st Installment</label>
              <input
                type="number"
                name="installment1"
                id="installment1"
                value={formData.installment1}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {formData.installment1Date && (
                <p className="mt-1 text-xs text-gray-500">Last Paid: {formatDate(formData.installment1Date)}</p>
              )}
            </div>
            <div>
              <label htmlFor="installment2" className="block text-sm font-medium text-gray-700">2nd Installment</label>
              <input
                type="number"
                name="installment2"
                id="installment2"
                value={formData.installment2}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {formData.installment2Date && (
                <p className="mt-1 text-xs text-gray-500">Last Paid: {formatDate(formData.installment2Date)}</p>
              )}
            </div>
            <div className="col-span-1">
              <label htmlFor="installment3" className="block text-sm font-medium text-gray-700">3rd Installment</label>
              <input
                type="number"
                name="installment3"
                id="installment3"
                value={formData.installment3}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {formData.installment3Date && (
                <p className="mt-1 text-xs text-gray-500">Last Paid: {formatDate(formData.installment3Date)}</p>
              )}
            </div>
          </div>

          {/* Invoice Section */}
          <div className="md:col-span-2 border-t pt-4 mt-4">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Invoices</h3>
            {formData.invoice.map((inv, index) => (
              <div key={index} className="flex items-end gap-2 mb-3">
                <div className="flex-grow">
                  <label htmlFor={`invoiceName-${index}`} className="block text-sm font-medium text-gray-700">Invoice Name</label>
                  <input
                    type="text"
                    id={`invoiceName-${index}`}
                    value={inv.name}
                    onChange={(e) => handleInvoiceChange(index, 'name', e.target.value)}
                    placeholder="e.g., Final Invoice"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                  />
                </div>
                <div className="flex-grow">
                  <label htmlFor={`invoiceUrl-${index}`} className="block text-sm font-medium text-gray-700">Invoice URL</label>
                  <input
                    type="url"
                    id={`invoiceUrl-${index}`}
                    value={inv.url}
                    onChange={(e) => handleInvoiceChange(index, 'url', e.target.value)}
                    placeholder="e.g., https://example.com/invoice.pdf"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeInvoiceField(index)}
                  className="p-2 text-red-600 hover:text-red-800 rounded-md hover:bg-red-50 transition-colors"
                  title="Remove Invoice"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addInvoiceField}
              className="flex items-center px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors mt-2"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1" /> Add Invoice
            </button>
          </div>

          {/* Remarks (full width) */}
          <div className="md:col-span-2">
            <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">Remarks</label>
            <textarea
              name="remarks"
              id="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            ></textarea>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrolledStudentEditModal;