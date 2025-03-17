'use client'

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Receipt, ReceiptItem } from '@/types/receipt';


// Load Stripe with your public key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);


// TODO: Cancel payment intent if user navigates away from page without completing payment
export default function ConfirmBill() {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [receipt, setReceipt] = useState<Receipt | null>(JSON.parse(localStorage.getItem('receipt') || 'null'));
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
        
    }, []);
        
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Confirm Your Bill</h2>
            <label className="block mb-2 font-semibold">{receipt?.merchant}</label>

            {/* Itemized Bill List */}
            {receipt?.items.map((item: ReceiptItem, index) => (
                <div key={index} className="flex justify-between items-center px-2 py-1 border-b">
                    {/* Quantity and Item Description */}
                    <div className="flex items-center space-x-2 w-3/5">
                        <span className="w-6 text-left">{item.quantity}</span> {/* Fixed width for quantity */}
                        <span className="flex-1">{item.description}</span> {/* Description takes the rest of the space */}
                    </div>

                    {/* Price */}
                    <div className="flex items-center space-x-2 w-2/5">
                        <span className="flex-1 text-right font-medium">$</span> {/* Fixed width for price column */}
                        <span className="w-20 text-right font-medium">{item.totalPrice.toFixed(2)}</span> {/* Fixed width for price column */}
                    </div>

                </div>
            ))}

            {/* Subtotal, Tax, Total */}
            <div className="flex justify-between items-center px-2 py-1 mt-4">
                <p className="w-4/5 text-right mr-4">Subtotal:</p>
                <div className="flex items-center space-x-2 w-1/5">
                    <span className="flex-1 text-right font-medium">$</span> {/* Fixed width for price column */}
                    <span className="w-20 text-right font-medium">{receipt?.subtotal.toFixed(2)}</span> {/* Fixed width for price column */}
                </div>
            </div>
            <div className="flex justify-between items-center px-2 py-1">
                <p className="w-4/5 text-right mr-4">Tax:</p>
                <div className="flex items-center space-x-2 w-1/5">
                    <span className="flex-1 text-right font-medium">$</span> {/* Fixed width for price column */}
                    <span className="w-20 text-right font-medium">{receipt?.tax == 0 ? (receipt?.total - receipt?.subtotal).toFixed(2) : receipt?.tax.toFixed(2)}</span> {/* Fixed width for price column */}
                </div>
            </div>
            <div className="flex justify-between items-center px-2 py-1 mb-6">
                <p className="w-4/5 text-right mr-4">Total:</p>
                <div className="flex items-center space-x-2 w-1/5">
                    <span className="flex-1 text-right font-medium">$</span> {/* Fixed width for price column */}
                    <span className="w-20 text-right font-medium">{receipt?.total.toFixed(2)}</span> {/* Fixed width for price column */}
                </div>
            </div>

            <div className='flex justify-between items-center px-2 font-semibold'>
                <label className="font-semibold w-4/5 text-right">Total due:</label>
                <span className='w-1/5'> </span>
            </div>

            {/* Ophelia Date Fee */}
            <div className="flex justify-between items-center p-2 mb-4 font-semibold">
                <p className="w-4/5 text-right">Ophelia Date Fee:</p>
                <p className="w-1/5 text-right font-medium">${receipt?.opheliaFee.toFixed(2)}</p>
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
