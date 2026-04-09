import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { cartService } from '../../services/services';

export const Cart = () => {
  const { cart, setCart, removeFromCart, clearCart, getTotalPrice } = useCart();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadServerCart = async () => {
      try {
        const res = await cartService.getCart();
        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        if (items.length > 0) {
          const normalized = items
            .filter((i) => i.eventId && i.eventId._id)
            .map((i) => ({ eventId: i.eventId._id, event: i.eventId, quantity: i.quantity }));
          if (normalized.length > 0) {
            setCart(normalized);
          }
        }
      } catch (error) {
        // keep local cart if server cart fetch fails
      }
    };
    loadServerCart();
  }, [setCart]);

  const selectedItem = useMemo(() => {
    if (!selectedEventId) return null;
    return cart.find((i) => i.eventId === selectedEventId) || null;
  }, [cart, selectedEventId]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    // Auto-focus first cart item so payment panel is populated without manual click
    if (!selectedEventId) {
      setSelectedEventId(cart[0].eventId);
    }

    setLoading(true);
    setCheckoutResult(null);
    try {
      const payloadItems = cart.map((item) => ({ eventId: item.eventId, quantity: item.quantity }));
      const res = await cartService.checkout(payloadItems);
      clearCart();
      navigate('/events/checkout', { state: res.data });
      setSelectedEventId(null);
    } catch (error) {
      alert(error?.response?.data?.message || error.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Cart</h1>
        {cart.length === 0 ? (
          <p className="text-gray-700">Your cart is empty.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Items</h2>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.eventId}
                    className={`border rounded p-4 flex items-center justify-between cursor-pointer ${
                      selectedEventId === item.eventId ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedEventId(item.eventId)}
                  >
                    <div>
                      <div className="font-semibold">{item.event.title}</div>
                      <div className="text-sm text-gray-600">
                        Qty: {item.quantity} | Price: Rs. {item.event.ticketPrice} | Subtotal: Rs.{' '}
                        {item.event.ticketPrice * item.quantity}
                      </div>
                    </div>
                    <button
                      className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.eventId);
                        if (selectedEventId === item.eventId) setSelectedEventId(null);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="text-lg font-bold">Total: Rs. {getTotalPrice()}</div>
                <button
                  disabled={loading}
                  onClick={handleCheckout}
                  className="px-5 py-3 rounded bg-green-600 text-white font-bold hover:bg-green-700 transition disabled:opacity-60"
                >
                  {loading ? 'Processing...' : 'Checkout'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center text-center">
              <div>
                <h2 className="text-xl font-bold mb-3">Payment Details</h2>
                <p className="text-gray-700 text-sm mb-2">
                  Click on an item to preview its basic info.
                </p>
                {selectedItem && (
                  <div className="mt-3 text-sm text-gray-700">
                    <div className="font-semibold mb-1">Selected Show: {selectedItem.event.title}</div>
                    <div>
                      Qty: {selectedItem.quantity} | Amount: Rs.{' '}
                      {selectedItem.event.ticketPrice * selectedItem.quantity}
                    </div>
                  </div>
                )}
                <p className="text-gray-700 text-sm mt-4">
                  Full bank & WhatsApp payment instructions will appear on the next screen after you click{' '}
                  <span className="font-semibold">Checkout</span>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
