import { useLocation, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ArrowLeft, Ticket, Building2, MessageCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../hooks/animationVariants';

export const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;

  if (!data) {
    return (
      <PageWrapper title="No Checkout Data">
        <Card variant="glass" padding="lg" className="max-w-md text-center">
          <p className="mb-4 text-slate-500 dark:text-slate-400">Go back to your cart and try checkout again.</p>
          <Button onClick={() => navigate('/events/cart')}>Go to Cart</Button>
        </Card>
      </PageWrapper>
    );
  }

  const { items = [], grandTotal, note } = data;

  return (
    <PageWrapper title="Payment Details" subtitle={note} className="max-w-3xl">
      <motion.div variants={staggerContainer(0.1)} initial="hidden" animate="visible" className="flex flex-col gap-4">
        {items.map(item => (
          <motion.div key={item.registrationId} variants={staggerItem}>
            <Card variant="glass" padding="lg">
              <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>

              <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                {item.paymentMessage || 'Pay the payment for this bank account number and send the receipt for this WhatsApp number.'}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50/60 p-3 dark:bg-white/5">
                  <Building2 size={16} className="shrink-0 text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-400">Bank Account</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.bankAccount || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50/60 p-3 dark:bg-white/5">
                  <MessageCircle size={16} className="shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-xs text-slate-400">WhatsApp</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.whatsappNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50/60 p-3 dark:bg-white/5">
                  <Ticket size={16} className="shrink-0 text-amber-500" />
                  <div>
                    <p className="text-xs text-slate-400">Quantity</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.quantity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/60 p-3 dark:bg-emerald-900/20">
                  <CheckCircle size={16} className="shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Amount Due</p>
                    <p className="font-bold text-emerald-700 dark:text-emerald-300">Rs. {item.totalPrice}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        <Card variant="glass" padding="md">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-slate-900 dark:text-white">Grand Total</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">Rs. {grandTotal}</p>
          </div>
        </Card>

        <div className="flex justify-between pt-2">
          <Button variant="secondary" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/events/cart')}>Back to Cart</Button>
          <Button onClick={() => navigate('/events/my-events')}>Go to My Events</Button>
        </div>
      </motion.div>
    </PageWrapper>
  );
};
