'use client'

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Receipt } from '@/types/receipt';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function ConfirmBill() {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const searchParams = useSearchParams();
    const router = useRouter();

    const dateId = searchParams?.get('dateId');
    const amount = searchParams?.get('amount');
    const manualAmount = amount ? parseFloat(amount) : null;
    const isManualEntry = Boolean(manualAmount);

    useEffect(() => {
        if (!dateId) {
            router.push('/dates');
            return;
        }

        const fetchClientSecret = async () => {
            try {
                let paymentAmount;
                
                if (isManualEntry && manualAmount) {
                    // For manual entry, calculate 15% of the entered amount
                    paymentAmount = manualAmount * 0.15;
                } else {
                    // Try to get receipt from localStorage for OCR path
                    const storedReceipt = localStorage.getItem('receipt');
                    if (storedReceipt) {
                        const parsedReceipt = JSON.parse(storedReceipt);
                        setReceipt(parsedReceipt);
                        paymentAmount = parsedReceipt.total * 0.15; // Calculate 15% of total
                    }
                }

                if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
                    throw new Error("Invalid payment amount");
                }

                // Convert amount to cents for Stripe
                const amountInCents = Math.round(paymentAmount * 100);

                const response = await fetch('/api/create-payment-intent', {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        amount: amountInCents,
                        dateId: dateId
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to create payment intent");
                }

                const data = await response.json();
                setClientSecret(data.clientSecret);
            } catch (err) {
                console.error("Error creating payment intent:", err);
                setError(err instanceof Error ? err.message : "Failed to setup payment");
            } finally {
                setLoading(false);
            }
        };

        fetchClientSecret();
    }, [dateId, isManualEntry, manualAmount, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F7FA]">
            <Header variant="default" />
            
            <div className="max-w-2xl mx-auto p-4 pb-32">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-[#cc0000] text-white py-6 px-8">
                        <h1 className="text-2xl font-semibold text-center">Confirm Your Bill</h1>
                    </div>

                    <div className="p-8">
                        {isManualEntry ? (
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-[#64748B]">
                                    <span>Total Amount:</span>
                                    <span>${manualAmount?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg font-semibold text-[#cc0000]">
                                    <span>Ophelia Date Fee (15%):</span>
                                    <span>${(manualAmount ? manualAmount * 0.15 : 0).toFixed(2)}</span>
                                </div>
                            </div>
                        ) : receipt ? (
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-[#64748B]">
                                    <span>Total Amount:</span>
                                    <span>${receipt.total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg font-semibold text-[#cc0000]">
                                    <span>Ophelia Date Fee (15%):</span>
                                    <span>${receipt.opheliaFee.toFixed(2)}</span>
                                </div>
                            </div>
                        ) : null}

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                                {error}
                            </div>
                        )}

                        {clientSecret ? (
                            <div className="mt-8">
                                <Elements stripe={stripePromise} options={{ 
                                    clientSecret,
                                    appearance: {
                                        theme: 'stripe',
                                        variables: {
                                            colorPrimary: '#cc0000',
                                        },
                                    },
                                }}>
                                    <StripePaymentForm dateId={dateId!} />
                                </Elements>
                            </div>
                        ) : !error ? (
                            <div className="text-center py-8 text-[#64748B]">
                                Setting up payment...
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}

function StripePaymentForm({ dateId }: { dateId: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        setError(null);

        try {
            const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/dates/post-date-payment/success?dateId=${dateId}`,
                },
                redirect: 'if_required',
            });

            if (paymentError) {
                throw new Error(paymentError.message);
            }

            if (paymentIntent?.status === 'succeeded') {
                // Update date request status
                const { error: updateError } = await supabase
                    .from('date_requests')
                    .update({
                        payment_status: 'paid',
                        payment_id: paymentIntent.id,
                        payment_date: new Date().toISOString()
                    })
                    .eq('id', dateId);

                if (updateError) throw updateError;

                router.push(`/dates/post-date-payment/success?dateId=${dateId}&paymentId=${paymentIntent.id}`);
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError(err instanceof Error ? err.message : 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || loading}
                className={`w-full py-4 bg-[#cc0000] text-white rounded-full font-medium shadow-sm transition-colors
                    ${(!stripe || loading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#aa0000]'}`}
            >
                {loading ? 'Processing...' : 'Pay Now'}
            </button>
        </form>
    );
}
