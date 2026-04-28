import { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { paymentService } from '../services/services';

function luhnCheck(num) {
  const arr = (num + '')
    .split('')
    .reverse()
    .map((x) => parseInt(x, 10));
  const sum = arr.reduce((acc, d, i) => {
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    return acc + d;
  }, 0);
  return sum % 10 === 0;
}

export default function PaymentModal({ isOpen, onClose, registrationId, amount, title }) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    const digits = (cardNumber || '').replace(/[^0-9]/g, '');
    if (!digits) errs.cardNumber = 'Card number is required';
    else if (digits.length < 12 || digits.length > 19) errs.cardNumber = 'Card number looks invalid';
    else if (!luhnCheck(digits)) errs.cardNumber = 'Card number failed validation';

    if (!cardName || cardName.trim().length < 2) errs.cardName = 'Name on card is required';

    if (!expiry) errs.expiry = 'Expiry required';
    else {
      const m = expiry.split('/').map(s => s.trim());
      if (m.length !== 2) errs.expiry = 'Expiry must be MM/YY';
      else {
        let mm = parseInt(m[0], 10);
        let yy = parseInt(m[1], 10);
        if (isNaN(mm) || mm < 1 || mm > 12) errs.expiry = 'Invalid month';
        else {
          // normalize year
          if (yy < 100) yy += 2000;
          const eDate = new Date(yy, mm - 1, 1);
          const now = new Date();
          // set to first of next month and compare
          const lastOfMonth = new Date(eDate.getFullYear(), eDate.getMonth() + 1, 1);
          if (lastOfMonth <= now) errs.expiry = 'Card is expired';
        }
      }
    }

    if (!cvv) errs.cvv = 'CVV required';
    else if (!/^[0-9]{3,4}$/.test(cvv)) errs.cvv = 'CVV must be 3 or 4 digits';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Create payment record
      const res = await paymentService.createPayment(registrationId, 'paypal');
      const paymentId = res.data.paymentId;

      // Simulate provider approval
      await paymentService.approvePayment(paymentId);

      // Force notifications refresh across the app
      window.dispatchEvent(new Event('notifications:refresh'));

      alert('Payment recorded successfully. Admin will verify your registration. You will receive a notification when admin approves.');
      onClose();
    } catch (err) {
      alert('Payment failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && onClose()} />
      <Card className="relative z-10 w-full max-w-md" padding="lg">
        <h3 className="mb-2 text-lg font-bold">Pay with Card (PayPal)</h3>
        <p className="mb-4 text-sm text-slate-500">Enter your card details. This is a simulated payment for demo purposes.</p>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Card number</label>
            <div className="flex items-center gap-2">
              <input
                className="w-full rounded-md border px-3 py-2"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
              />
            </div>
            {errors.cardNumber && <div className="mt-1 text-xs text-rose-500">{errors.cardNumber}</div>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Name on card</label>
            <input className="w-full rounded-md border px-3 py-2" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Full name" />
            {errors.cardName && <div className="mt-1 text-xs text-rose-500">{errors.cardName}</div>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Expiry (MM/YY)</label>
              <input className="w-full rounded-md border px-3 py-2" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="08/26" />
              {errors.expiry && <div className="mt-1 text-xs text-rose-500">{errors.expiry}</div>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">CVV</label>
              <input className="w-full rounded-md border px-3 py-2" value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" inputMode="numeric" />
              {errors.cvv && <div className="mt-1 text-xs text-rose-500">{errors.cvv}</div>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Amount</div>
              <div className="text-sm font-bold">Rs. {amount}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => onClose()} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} isLoading={submitting}>Pay</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
