// src/components/dashboard/DashboardChartPlaceholder.jsx
import React from 'react';

const DashboardChartPlaceholder = ({ title, description = "Chart data will be displayed here.", heightClass = "h-64" }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-4">{description}</p>
      <div className={`flex-grow flex items-center justify-center bg-gray-100 border border-dashed border-gray-300 rounded-md text-gray-400 text-center text-sm ${heightClass}`}>
        {/* Placeholder for actual chart component (e.g., from Recharts, Chart.js) */}
        <p>Loading {title}...</p>
        {/*
        <YourChartComponent data={chartData} options={chartOptions} />
        Example:
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
        */}
      </div>
    </div>
  );
};

export default DashboardChartPlaceholder;