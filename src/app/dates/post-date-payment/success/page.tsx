'use client'
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentSuccess() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [amountPaid, setAmountPaid] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPaymentDetails = async () => {
            const sessionId = searchParams.get('sessionId');
            if (!sessionId) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/payment-details?sessionId=${sessionId}`);
                const data = await response.json();
                
                if (response.ok) {
                    setPaymentId(data.paymentId);
                    setAmountPaid(data.amountPaid);
                } else {
                    console.error('Error fetching payment details:', data.error);
                }
            } catch (error) {
                console.error('Error fetching payment details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentDetails();
    }, [searchParams]);

    return (
        <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg text-center">
            {loading ? (
                <p className="mt-4 text-gray-600">Fetching payment details...</p>
            ) : paymentId ? (
                <>
                    <h2 className="text-2xl font-bold text-green-600">🎉 Payment Successful!</h2>
                    <p className="mt-2 text-gray-900 font-medium">Amount Paid: <span className="text-green-500">${amountPaid}</span></p>
                    <p className="mt-2 text-gray-500 text-sm">Transaction ID: {paymentId}</p>

                    <div className="mt-6 flex flex-col gap-3">
                        <button
                            onClick={() => router.push('/')}
                            className="w-full py-3 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 transition"
                        >
                            Return to Home
                        </button>
                        {/* TODO: Add payment history page */}
                        <button
                            onClick={() => router.push('/payment-history')}
                            className="w-full py-3 bg-gray-700 text-white rounded-md font-medium hover:bg-gray-800 transition"
                        >
                            View Payment History
                        </button>
                    </div>
                </>
            ) : (
                <p className="mt-4 text-red-600">Error fetching payment details. Please check your email for a receipt.</p>
            )}
        </div>
    );

}

    