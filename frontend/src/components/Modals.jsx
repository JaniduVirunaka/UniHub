import React from 'react';

export const ConfirmationModal = ({ isOpen, title, message, onYes, onNo }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-4">
          <button
            onClick={onNo}
            className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded transition"
          >
            No
          </button>
          <button
            onClick={onYes}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export const AlertModal = ({ isOpen, title, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};
