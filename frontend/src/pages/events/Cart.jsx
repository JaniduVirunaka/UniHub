import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { cartService } from '../../services/services';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Trash2, ShoppingCart, CreditCard, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../hooks/animationVariants';

export const Cart = () => {
  const { cart, setCart, removeFromCart, clearCart, getTotalPrice } = useCart();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    cartService.getCart()
      .then(res => {
        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        if (items.length > 0) {
          const normalized = items
            .filter(i => i.eventId && i.eventId._id)
            .map(i => ({ eventId: i.eventId._id, event: i.eventId, quantity: i.quantity }));
          if (normalized.length > 0) setCart(normalized);
        }
      })
      .catch(() => {}); // keep local cart on failure
  }, [setCart]);

  const selectedItem = useMemo(() => {
    if (!selectedEventId) return null;
    return cart.find(i => i.eventId === selectedEventId) || null;
  }, [cart, selectedEventId]);

  const handleCheckout = async () => {
    if (!cart.length) { alert('Your cart is empty'); return; }
    if (!selectedEventId) setSelectedEventId(cart[0].eventId);
    setLoading(true);
    try {
      const res = await cartService.checkout(cart.map(i => ({ eventId: i.eventId, quantity: i.quantity })));
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
    <PageWrapper title="Your Cart" subtitle="Review your ticket selections before checkout">
      {cart.length === 0 ? (
        <Card variant="glass" padding="lg" className="text-center">
          <ShoppingCart size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400">Your cart is empty.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/events')}>Browse Events</Button>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Cart items */}
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-slate-900 dark:text-white">Items ({cart.length})</h2>
            <motion.div variants={staggerContainer(0.07)} initial="hidden" animate="visible" className="flex flex-col gap-3">
              {cart.map(item => (
                <motion.div key={item.eventId} variants={staggerItem}>
                  <Card
                    variant="glass"
                    padding="md"
                    className={`cursor-pointer transition ${selectedEventId === item.eventId ? 'ring-2 ring-indigo-500' : ''}`}
                    onClick={() => setSelectedEventId(item.eventId)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.event.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Qty: {item.quantity} · Rs. {item.event.ticketPrice} · Subtotal: Rs. {item.event.ticketPrice * item.quantity}
                        </p>
                      </div>
                      <Button size="sm" variant="danger" leftIcon={<Trash2 size={13} />} aria-label="Remove item"
                        onClick={e => { e.stopPropagation(); removeFromCart(item.eventId); if (selectedEventId === item.eventId) setSelectedEventId(null); }}
                      />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <div className="flex items-center justify-between border-t border-slate-200/60 pt-4 dark:border-white/10">
              <p className="text-lg font-bold text-slate-900 dark:text-white">Total: Rs. {getTotalPrice()}</p>
              <Button disabled={loading} isLoading={loading} rightIcon={<ChevronRight size={14} />} onClick={handleCheckout}>
                Checkout
              </Button>
            </div>
          </div>

          {/* Payment preview panel */}
          <Card variant="glass" padding="lg" className="flex h-fit flex-col items-center text-center">
            <CreditCard size={32} className="mb-3 text-indigo-500" />
            <h2 className="mb-2 font-bold text-slate-900 dark:text-white">Payment Details</h2>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Click an item to preview its basic info.</p>
            {selectedItem && (
              <div className="mt-2 w-full rounded-2xl bg-slate-50/60 p-3 text-left text-sm dark:bg-white/5">
                <p className="mb-1 font-semibold text-slate-900 dark:text-white">{selectedItem.event.title}</p>
                <p className="text-slate-500 dark:text-slate-400">Qty: {selectedItem.quantity} · Rs. {selectedItem.event.ticketPrice * selectedItem.quantity}</p>
              </div>
            )}
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Full bank &amp; WhatsApp payment instructions will appear after clicking <strong>Checkout</strong>.
            </p>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
};
