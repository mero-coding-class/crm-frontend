import React from "react";

export default function StudentDetails({ formData, onChange, courseOptions, teachers = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Student Name</label>
        <input name="student_name" value={formData.student_name || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Parents Name</label>
        <input name="parents_name" value={formData.parents_name || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" name="email" value={formData.email || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input name="phone_number" value={formData.phone_number || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Course</label>
        <select name="course" value={formData.course || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1">
          <option value="">Select course</option>
          {(courseOptions || []).map((c) => (
            <option key={c.id} value={c.id}>{c.course_name || c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Assigned Teacher</label>
        {Array.isArray(teachers) && teachers.length > 0 ? (
          <select
            name="assigned_teacher"
            value={formData.assigned_teacher || ""}
            onChange={onChange}
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            <option value="">Select teacher</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        ) : (
          <input name="assigned_teacher" value={formData.assigned_teacher || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Batch Name</label>
        <input name="batchname" value={formData.batchname || formData.batch_name || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Course Duration</label>
        <input name="course_duration" value={formData.course_duration || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Starting Date</label>
        <input type="date" name="starting_date" value={formData.starting_date || ""} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
      </div>
    </div>
  );
}
