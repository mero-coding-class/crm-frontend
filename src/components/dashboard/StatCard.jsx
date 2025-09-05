import React from "react";

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  colorClass = "text-blue-600 bg-blue-100",
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between transition-transform transform hover:scale-105 duration-200">
      <div className="flex-grow">
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {description && (
          <p className="text-gray-400 text-xs mt-1">{description}</p>
        )}
      </div>

      {Icon && (
        <div
          className={`p-3 rounded-full flex items-center justify-center ${colorClass}`}
        >
          <Icon className="h-8 w-8" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
