'use client'

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Receipt, ReceiptItem } from '@/types/receipt';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';


// Load Stripe with your public key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);


// TODO: Cancel payment intent if user navigates away from page without completing payment
export default function ConfirmBill() {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [receipt, setReceipt] = useState<Receipt | null>(typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('receipt') || 'null') : null);
    const [error, setError] = useState<string | null>(null);
    const [manualAmount, setManualAmount] = useState<number | null>(null);
    const [manual, setManual] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const searchParams = useSearchParams();
    const amount = searchParams?.get('amount');

    useEffect(() => {
        if (amount) {
            setManual(true);
            setManualAmount(parseFloat(amount));
        }
        
        const fetchClientSecret = async () => {
            try {
                let paymentAmount;
                if (amount) {
                    paymentAmount = parseFloat(amount) * 0.15;
                } else if (receipt?.opheliaFee) {
                    paymentAmount = receipt.opheliaFee;
                } else {
                    throw new Error("No valid amount found");
                }

                if (isNaN(paymentAmount) || paymentAmount <= 0) {
                    throw new Error("Invalid amount");
                }

                const response = await fetch('/api/create-payment-intent', {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json'},
                    body: JSON.stringify({ amount: paymentAmount }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to create payment intent");
                }
                
                const data = await response.json();
                setClientSecret(data.clientSecret);
            } catch (error) {
                console.error("Error fetching client secret:", error);
                setError(error instanceof Error ? error.message : "Error creating payment intent");
            }
        };
        
        if (amount || receipt?.opheliaFee) {
            fetchClientSecret();
        }
        setLoading(false);
    }, [amount, receipt?.opheliaFee]);

    return (
        <div className="min-h-screen bg-[#F5F7FA]">
            <Header variant="default" />
            
            <div className="max-w-2xl mx-auto p-4 pb-32">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-[#cc0000] text-white py-6 px-8">
                        <h1 className="text-2xl font-semibold text-center">Confirm Your Bill</h1>
                    </div>

                    <div className="p-8">
                        {!manual ? (
                            <>
                                {receipt?.merchant && (
                                    <div className="mb-6">
                                        <h2 className="text-xl font-semibold text-[#334155] mb-2">{receipt.merchant}</h2>
                                    </div>
                                )}

                                {receipt?.items && receipt.items.length > 0 && (
                                    <div className="space-y-3 mb-6">
                                        {receipt.items.map((item: ReceiptItem, index: number) => (
                                            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-[#64748B]">{item.quantity}x</span>
                                                    <span className="text-[#334155]">{item.description}</span>
                                                </div>
                                                <span className="text-[#334155] font-medium">${item.totalPrice.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-2 mb-8">
                                    <div className="flex justify-between items-center text-[#64748B]">
                                        <span>Subtotal:</span>
                                        <span>${receipt?.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[#64748B]">
                                        <span>Tax:</span>
                                        <span>${((receipt?.tax || 0) + ((receipt?.total || 0) - (receipt?.subtotal || 0))).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xl font-semibold text-[#334155]">
                                        <span>Total:</span>
                                        <span>${receipt?.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="mb-8">
                                <div className="flex justify-between items-center text-xl font-semibold text-[#334155]">
                                    <span>Total:</span>
                                    <span>${manualAmount?.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        <div className="border-t border-gray-200 pt-6 mb-8">
                            <div className="flex justify-between items-center text-lg font-semibold text-[#cc0000]">
                                <span>Ophelia Date Fee (15%):</span>
                                <span>${manual ? ((manualAmount || 0) * 0.15).toFixed(2) : (receipt?.opheliaFee || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                                {error}
                            </div>
                        )}

                        {clientSecret && (
                            <div className="bg-white rounded-xl">
                                <Elements stripe={stripePromise} options={{ clientSecret }}>
                                    <StripePaymentForm />
                                </Elements>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}

// StripePaymentForm component
function StripePaymentForm() {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const searchParams = useSearchParams();
    const dateId = searchParams?.get('dateId');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!dateId) {
            router.push('/dates');
        }
    }, [dateId, router]);

    const handlePayment = async () => {
        if (!stripe || !elements || !dateId) {
            setError("Missing required information");
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            const { paymentIntent, error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/dates/post-date-payment/success`,
                },
                redirect: 'if_required',
            });

            if (error) {
                setError(error.message || "Payment failed");
            } else if (paymentIntent?.status === "succeeded") {
                // Update date_requests table with payment information
                const { error: updateError } = await supabase
                    .from('date_requests')
                    .update({
                        payment_status: 'paid',
                        payment_amount: paymentIntent.amount / 100, // Convert from cents to dollars
                        payment_id: paymentIntent.id,
                        payment_date: new Date().toISOString()
                    })
                    .eq('id', dateId);

                if (updateError) {
                    console.error('Error updating date request:', updateError);
                }

                // Redirect to success page
                router.push(`/dates/post-date-payment/success?paymentId=${paymentIntent.id}&amountPaid=${paymentIntent.amount}&dateId=${dateId}`);
            }
        } catch (err) {
            setError(`Error processing payment, please try again`);
            console.log("Error", err);
        } finally {
            setLoading(false);
        }
    };

    if (!dateId) {
        return <div>Invalid date request</div>;
    }

    return (
        <div className="mt-4">
            <PaymentElement />
            {error && <p className="text-red-500 mt-2">{error}</p>}
            <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full p-2 bg-[#cc0000] text-white rounded-md mt-4 hover:bg-[#aa0000] transition-colors"
            >
                {loading ? "Processing..." : "Pay Now"}
            </button>
        </div>
    );
}
