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
        setPaymentId(searchParams.get('paymentId'));
        const amount = searchParams.get('amountPaid');
        setAmountPaid(amount ? parseFloat(amount) / 100 : null);

        setLoading(false);
        
        // clean up localStorage
        return () => localStorage.removeItem('receipt');
    }, [searchParams]);

    return (
        <div className="p-6 max-w-md mx-auto h-screen bg-white text-center flex flex-col justify-center">
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

    