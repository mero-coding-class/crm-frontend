import React from 'react';

const AuthForm = ({ title, fields, onSubmit, submitButtonText, error, isLoading, children }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    fields.forEach(field => {
      data[field.name] = formData.get(field.name);
    });
    onSubmit(data);
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-custom text-center">
      <h2 className="text-3xl font-bold text-textPrimary">{title}</h2>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="text-left">
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              pattern={field.pattern} // For OTP pattern
              title={field.title}     // For OTP title
              className="input-field"
            />
          </div>
        ))}
        {children} {/* For extra elements like "Forgot password" or "Already have an account?" */}
        <button
          type="submit"
          className="btn-primary w-full mt-6"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            submitButtonText
          )}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;