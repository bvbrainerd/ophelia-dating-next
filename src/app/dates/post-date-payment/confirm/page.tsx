'use client'

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import Stripe from "stripe";
import { Receipt, ReceiptItem } from '@/types/receipt';


// Load Stripe with your public key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function ConfirmBill() {
    const router = useRouter();

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [receipt, setReceipt] = useState<Receipt | null>(JSON.parse(localStorage.getItem('receipt') || 'null'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch the PaymentIntent client secret when the component mounts
    useEffect(() => {
        const fetchClientSecret = async () => {
            try {
                const response = await fetch('/api/create-payment-intent', {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json'},
                    body: JSON.stringify({ amount: receipt?.opheliaFee}),
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

    }, [receipt]); // useEffect runs anytime initialTotal changes
        
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Confirm Your Bill</h2>
            <label className="block mb-2">{receipt?.merchant}</label>
            {receipt?.items.map((item: ReceiptItem, index) => (
                <div key={index} className="flex justify-between px-2">
                    <p>{item.quantity} {item.description}</p>
                    <p>${item.totalPrice}</p>
                </div>
            ))}
            <div className='flex justify-between px-2'>
                <p>Subtotal:</p>
                <p>${receipt?.subtotal}</p>
            </div>
            <div className='flex justify-between px-2'>
                <p>Tax:</p>
                <p >${receipt?.tax}</p>
            </div>
            <div className='flex justify-between px-2 mb-6'>
                <p>Total:</p>
                <p>${receipt?.total}</p>
            </div>

            <label className="block mb-2 font-semibold">Total due:</label>

            <div className='flex justify-between p-2 mb-4 font-semibold'>
                <p>Ophelia Date Fee:</p>
                <p>${receipt?.opheliaFee}</p>
            </div>

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
                const paymentId = paymentIntent.id;
                

                // Redirect to the success page with the sessionId
                router.push(`/dates/post-date-payment/success?paymentId=${paymentId}&amountPaid=${paymentIntent.amount}`);
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
                className="p-2 bg-[#cc0000] text-white rounded-md mt-4"
            >
                {loading ? "Processing..." : "Pay Now"}
            </button>
        </div>
    );
}
