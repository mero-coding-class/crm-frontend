import React from "react";
import { PAYMENT_TYPE_OPTIONS } from "../../constants/paymentOptions";

export default function PaymentDetails({ formData, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Total Payment</label>
        <input type="number" step="0.01" name="total_payment" value={formData.total_payment || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Payment Type</label>
        <select name="payment_type" value={formData.payment_type || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1">
          {(PAYMENT_TYPE_OPTIONS || []).map((opt) => (
            <option key={opt} value={opt === "Select" ? "" : opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">First Installment</label>
        <input type="number" step="0.01" name="first_installment" value={formData.first_installment || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Second Installment</label>
        <input type="number" step="0.01" name="second_installment" value={formData.second_installment || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Third Installment</label>
        <input type="number" step="0.01" name="third_installment" value={formData.third_installment || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
      </div>
      <div className="flex items-center gap-2">
        <input id="payment_completed" type="checkbox" name="payment_completed" checked={!!formData.payment_completed} onChange={onChange} />
        <label htmlFor="payment_completed" className="text-sm font-medium text-gray-700">Payment Completed</label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Last Pay Date</label>
        <input type="date" name="last_pay_date" value={formData.last_pay_date || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Next Pay Date</label>
        <input type="date" name="next_pay_date" value={formData.next_pay_date || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">Remarks</label>
        <textarea name="remarks" value={formData.remarks || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" rows={3} />
      </div>
    </div>
  );
}
