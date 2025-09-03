import React, { useState, useEffect, useRef } from "react";
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext.jsx";

const EnrolledStudentEditModal = ({ student, onClose, onSave }) => {
  const { authToken } = useAuth();
  const [courseOptions, setCourseOptions] = useState([]);
  const [formData, setFormData] = useState({
    ...student,
    student_name: student?.student_name || "",
    parents_name: student?.parents_name || "",
    email: student?.email || "",
    phone_number: student?.phone_number || "",
    course_name: student?.course_name || "",
    total_payment: student?.total_payment ?? "",
    first_installment: student?.first_installment ?? "",
    second_installment: student?.second_installment ?? "",
    third_installment: student?.third_installment ?? "",
    last_pay_date: student?.last_pay_date || "",
    payment_completed: student?.payment_completed,
    invoice: student?.invoice ? [...student.invoice] : [],
    remarks: student?.remarks || "",
  });

  const modalRef = useRef(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(
          "https://crmmerocodingbackend.ktm.yetiappcloud.com/api/courses/",
          {
            method: "GET",
            headers: {
              Authorization: `Token ${authToken}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const courseNames = data.map((course) => course.course_name);
        setCourseOptions(courseNames);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      }
    };
    if (authToken) {
      fetchCourses();
    }
  }, [authToken]);

  useEffect(() => {
    if (student) {
      setFormData({
        ...student,
        student_name: student.student_name || "",
        parents_name: student.parents_name || "",
        email: student.email || "",
        phone_number: student.phone_number || "",
        course_name: student.course_name || "",
        total_payment: student.total_payment ?? "",
        first_installment: student.first_installment ?? "",
        second_installment: student.second_installment ?? "",
        third_installment: student.third_installment ?? "",
        last_pay_date: student.last_pay_date || "",
        payment_completed: student.payment_completed,
        invoice: student.invoice ? [...student.invoice] : [],
        remarks: student.remarks || "",
      });
    }
  }, [student]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
      invoice: [...prev.invoice, { name: "", url: "", date: "" }],
    }));
  };

  const removeInvoiceField = (index) => {
    setFormData((prev) => ({
      ...prev,
      invoice: prev.invoice.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedStudentData = {
      ...formData,
      total_payment: formData.total_payment
        ? parseFloat(formData.total_payment)
        : null,
      first_installment: formData.first_installment
        ? parseFloat(formData.first_installment)
        : null,
      second_installment: formData.second_installment
        ? parseFloat(formData.second_installment)
        : null,
      third_installment: formData.third_installment
        ? parseFloat(formData.third_installment)
        : null,

      // Fix for the date format issue:
      last_pay_date: formData.last_pay_date || null,

      invoice: formData.invoice.filter((inv) => inv.name && inv.url),
    };

    onSave(updatedStudentData);
    onClose();
  };

  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-gray-600/50 flex items-center justify-center z-50 overflow-y-auto p-4 animate-fade-in">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-auto my-8 transform transition-all animate-scale-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800">
            Edit Enrolled Student
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Student Details */}
          <div>
            <label
              htmlFor="student_name"
              className="block text-sm font-medium text-gray-700"
            >
              Student Name
            </label>
            <input
              type="text"
              name="student_name"
              id="student_name"
              value={formData.student_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="parents_name"
              className="block text-sm font-medium text-gray-700"
            >
              Parents' Name
            </label>
            <input
              type="text"
              name="parents_name"
              id="parents_name"
              value={formData.parents_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
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
            <label
              htmlFor="phone_number"
              className="block text-sm font-medium text-gray-700"
            >
              Phone
            </label>
            <input
              type="tel"
              name="phone_number"
              id="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="course_name"
              className="block text-sm font-medium text-gray-700"
            >
              Course
            </label>
            <select
              name="course_name"
              id="course_name"
              value={formData.course_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select Course</option>
              {courseOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Details */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t pt-4 mt-4">
            <div>
              <label
                htmlFor="total_payment"
                className="block text-sm font-medium text-gray-700"
              >
                Total Payment
              </label>
              <input
                type="number"
                name="total_payment"
                id="total_payment"
                value={formData.total_payment}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="first_installment"
                className="block text-sm font-medium text-gray-700"
              >
                1st Installment
              </label>
              <input
                type="number"
                name="first_installment"
                id="first_installment"
                value={formData.first_installment}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="second_installment"
                className="block text-sm font-medium text-gray-700"
              >
                2nd Installment
              </label>
              <input
                type="number"
                name="second_installment"
                id="second_installment"
                value={formData.second_installment}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="col-span-1">
              <label
                htmlFor="third_installment"
                className="block text-sm font-medium text-gray-700"
              >
                3rd Installment
              </label>
              <input
                type="number"
                name="third_installment"
                id="third_installment"
                value={formData.third_installment}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="col-span-1">
              <label
                htmlFor="last_pay_date"
                className="block text-sm font-medium text-gray-700"
              >
                Last Pay Date
              </label>
              <input
                type="date"
                name="last_pay_date"
                id="last_pay_date"
                value={formData.last_pay_date}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Invoice Section */}
          <div className="md:col-span-2 border-t pt-4 mt-4">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Invoices</h3>
            {formData.invoice.map((inv, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row items-end gap-2 mb-3"
              >
                <div className="flex-grow">
                  <label
                    htmlFor={`invoiceName-${index}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Invoice Name
                  </label>
                  <input
                    type="text"
                    id={`invoiceName-${index}`}
                    value={inv.name || ""}
                    onChange={(e) =>
                      handleInvoiceChange(index, "name", e.target.value)
                    }
                    placeholder="e.g., Final Invoice"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                  />
                </div>
                <div className="flex-grow">
                  <label
                    htmlFor={`invoiceUrl-${index}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Invoice URL
                  </label>
                  <input
                    type="url"
                    id={`invoiceUrl-${index}`}
                    value={inv.url || ""}
                    onChange={(e) =>
                      handleInvoiceChange(index, "url", e.target.value)
                    }
                    placeholder="e.g., https://example.com/invoice.pdf"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                  />
                </div>
                <div className="flex-grow-0">
                  <label
                    htmlFor={`invoiceDate-${index}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    id={`invoiceDate-${index}`}
                    value={inv.date || ""}
                    onChange={(e) =>
                      handleInvoiceChange(index, "date", e.target.value)
                    }
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
            <label
              htmlFor="remarks"
              className="block text-sm font-medium text-gray-700"
            >
              Remarks
            </label>
            <textarea
              name="remarks"
              id="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            ></textarea>
          </div>

          {/* Action Buttons */}
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
