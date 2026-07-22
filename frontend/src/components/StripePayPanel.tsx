import { useState } from 'react';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

function PayForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handlePay() {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setSubmitting(true);
    setStatus(null);

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    if (result.error) {
      setStatus(`❌ ${result.error.message}`);
    } else if (result.paymentIntent?.status === 'succeeded') {
      setStatus('✅ Payment succeeded — the order should flip to PAID once your webhook receives the event.');
    } else {
      setStatus(`Payment status: ${result.paymentIntent?.status}`);
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-3">
      <div className="border border-line rounded-md px-3 py-2.5 bg-panel">
        <CardElement options={{ style: { base: { fontSize: '14px' } } }} />
      </div>
      <button
        onClick={handlePay}
        disabled={!stripe || submitting}
        className="bg-ink text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo transition-colors disabled:opacity-50"
      >
        {submitting ? 'Confirming…' : 'Pay with test card'}
      </button>
      <p className="text-xs text-slate-muted">
        Test card 4242 4242 4242 4242, any future date, any CVC, any postal code.
      </p>
      {status && <p className="text-sm">{status}</p>}
    </div>
  );
}

export function StripePayPanel({ clientSecret }: { clientSecret: string }) {
  return (
    <div className="mt-6 border-t border-line pt-5">
      <h3 className="text-xs font-medium uppercase tracking-wide text-slate-muted mb-3">
        Confirm payment
      </h3>
      <Elements stripe={stripePromise}>
        <PayForm clientSecret={clientSecret} />
      </Elements>
    </div>
  );
}
