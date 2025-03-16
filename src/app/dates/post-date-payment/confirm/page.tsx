'use client'

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";


// Load Stripe with your public key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function ConfirmBill() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialTotal = parseFloat(searchParams.get('total') || '0');
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [total, setTotal] = useState(initialTotal);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch the PaymentIntent client secret when the component mounts
    useEffect(() => {
        const fetchClientSecret = async () => {
            try {
                const response = await fetch('/api/create-payment-intent', {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json'},
                    body: JSON.stringify({ amount: initialTotal}),
                });

                if (!response.ok) {
                    throw new Error("Failed to create payment intent");
                }

                const data = await response.json();
                setClientSecret(data.clientSecret);
            } catch (error) {
                setError("Error creating payment intent");
                console.error("Error fetching client secret:", error);
            }
        };

        fetchClientSecret();
    }, [initialTotal]); // useEffect runs anytime initialTotal changes
        
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Confirm Your Bill</h2>
            <label className="block mb-2">Total Amount:</label>
            <input
                type="number"
                value={initialTotal}
                disabled
                className="p-2 border rounded-md w-full mb-4"
            />

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* Stripe Elements will be rendered here */}
            {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <StripePaymentForm />
                </Elements>
            )}
        </div>
    );
};

// StripePaymentForm component
function StripePaymentForm() {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async () => {
        if (!stripe || !elements) return;
        
        setLoading(true);
        setError(null);

        try {
            const { paymentIntent, error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/dates/post-date-payment/success`,
                },
                redirect: 'if_required', // Prevents automatic Stripe redirect, allows manual handling
            });

            if (error) {
                setError(error.message || "Payment failed");
            } else if (paymentIntent?.status === "succeeded") {
                // Extract the PaymentIntent ID (sessionId)
                const sessionId = paymentIntent.id;

                // Redirect to the success page with the sessionId
                router.push(`/dates/post-date-payment/success?sessionId=${sessionId}`);
            }
        } catch (err) {
            setError(`Error processing payment, please try again`);
            console.log("Error", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4">
            <PaymentElement />
            {error && <p className="text-red-500 mt-2">{error}</p>}
            <button
                onClick={handlePayment}
                disabled={loading}
                className="p-2 bg-green-500 text-white rounded-md mt-4"
            >
                {loading ? "Processing..." : "Pay Now"}
            </button>
        </div>
    );
}
