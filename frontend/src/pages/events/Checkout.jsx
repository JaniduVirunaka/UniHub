import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">No Checkout Data</h1>
          <p className="text-gray-600 mb-6">Go back to your cart and try checkout again.</p>
          <button
            onClick={() => navigate('/events/cart')}
            className="px-5 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Go to Cart
          </button>
        </div>
      </div>
    );
  }

  const { items = [], grandTotal, note } = data;

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Payment Details</h1>
          <p className="text-gray-700">{note}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Your Tickets</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.registrationId} className="border rounded p-4 bg-gray-50">
                <div className="font-semibold text-lg mb-1">{item.title}</div>
                <div className="text-sm text-gray-700 mb-2">
                  {item.paymentMessage ||
                    'Pay the payment for this bank account number and send the receipt for this WhatsApp number.'}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Bank Account:</span> {item.bankAccount || 'N/A'}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">WhatsApp:</span> {item.whatsappNumber || 'N/A'}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Quantity:</span> {item.quantity}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Amount:</span> Rs. {item.totalPrice}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-right text-lg font-bold">
            Grand Total: <span className="text-green-700">Rs. {grandTotal}</span>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate('/events/cart')}
            className="px-5 py-2 rounded bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
          >
            Back to Cart
          </button>
          <button
            onClick={() => navigate('/events/my-events')}
            className="px-5 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Go to My Events
          </button>
        </div>
      </div>
    </div>
  );
};

