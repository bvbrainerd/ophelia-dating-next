'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/supabase/client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft } from "lucide-react";

export default function PostDatePayment({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
    const [manual, setManual] = useState(false);
    const [manualAmount, setManualAmount] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCameraStarted, setIsCameraStarted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const dateId = typeof searchParams?.dateId === 'string' ? searchParams.dateId : null;
    const router = useRouter();

    useEffect(() => {
        if (!dateId) {
            router.push('/dates');
        }
        return () => {
            // Cleanup camera stream when component unmounts
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [dateId, router]);

    const startCamera = async () => {
        try {
            if (isCameraStarted && mediaStreamRef.current) {
                // Stop the camera if it's already running
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                setIsCameraStarted(false);
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }, // Use back camera on mobile
                audio: false
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                mediaStreamRef.current = stream;
                setIsCameraStarted(true);
                setError(null);
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Could not access camera. Please ensure you have granted camera permissions.');
            setIsCameraStarted(false);
        }
    };

    const captureImage = () => {
        if (!isCameraStarted || !videoRef.current || !canvasRef.current) {
            setError('Camera is not started');
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
            setError('Could not initialize canvas context');
            return;
        }

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the video frame to canvas
        context.drawImage(video, 0, 0);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
                setImage(file);
                setPreview(URL.createObjectURL(blob));
                setError(null);
            }
        }, 'image/jpeg');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setError(null);
        }
    };

    const submitImage = async () => {
        if (!image || !dateId) return;
        setIsProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('receipt', image);
            formData.append('dateId', dateId);

            const response = await fetch('/api/upload-receipt', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Failed to upload receipt');

            const data = await response.json();
            router.push(`/dates/post-date-payment/confirm?dateId=${dateId}`);
        } catch (err) {
            console.error('Error uploading receipt:', err);
            setError('Failed to upload receipt. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const submitManualTotal = async () => {
        if (!dateId || !manualAmount) return;
        setIsProcessing(true);
        setError(null);

        try {
            const amount = parseFloat(manualAmount);
            if (isNaN(amount)) throw new Error('Invalid amount');

            const { error: updateError } = await supabase
                .from('date_requests')
                .update({
                    payment_status: 'pending',
                    payment_amount: amount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', dateId);

            if (updateError) throw updateError;
            router.push(`/dates/post-date-payment/confirm?dateId=${dateId}&amount=${amount}`);
        } catch (err) {
            console.error('Error submitting manual total:', err);
            setError('Failed to submit total. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSetManual = () => {
        // Stop camera if running when switching to manual mode
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            setIsCameraStarted(false);
        }
        setManual(true);
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] pb-32">
            {/* Ophelia Header */}
            <Header variant="default" />

            <div className="max-w-2xl mx-auto p-4">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Card Header */}
                    <div className="bg-[#cc0000] text-white py-6 px-8">
                        <h1 className="text-2xl font-semibold text-center">Verify Your Date</h1>
                    </div>

                    <div className="p-8">
                        {!manual ? (
                            <>
                                {/* Upload Area */}
                                <label 
                                    className="block border-2 border-dashed border-[#E0E4EA] rounded-xl p-8 mb-8 text-center cursor-pointer hover:bg-[#F8FAFC] transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="mb-4">
                                        <div className="w-14 h-14 bg-[#F5F7FA] rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-6 h-6 text-[#94A3B8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        </div>
                                        <h3 className="text-[#334155] text-lg font-medium mb-2">Upload your receipt</h3>
                                        <p className="text-[#64748B]">Drag and drop or select a file</p>
                                    </div>

                                    {/* Hidden file input */}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        accept="image/*" 
                                        onChange={handleFileChange} 
                                        className="hidden" 
                                    />

                                    {/* Image preview */}
                                    {preview && (
                                        <div className="mt-4">
                                            <Image 
                                                src={preview} 
                                                alt="Receipt Preview" 
                                                width={300} 
                                                height={400} 
                                                className="w-full max-w-md mx-auto h-auto rounded-xl shadow-md" 
                                            />
                                        </div>
                                    )}
                                </label>

                                {/* Camera Controls */}
                                {isCameraStarted && (
                                    <div className="mb-8">
                                        <video 
                                            ref={videoRef} 
                                            autoPlay 
                                            playsInline 
                                            className="w-full rounded-xl shadow-md mb-4" 
                                        />
                                    </div>
                                )}
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Camera and Capture Buttons */}
                                <div className="flex gap-4 mb-6">
                                    <button
                                        onClick={startCamera}
                                        className="flex-1 py-3 px-6 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l5 5-5 5" />
                                            </svg>
                                        </div>
                                        {isCameraStarted ? 'Stop Camera' : 'Start Camera'}
                                    </button>
                                    <button
                                        onClick={captureImage}
                                        disabled={!isCameraStarted}
                                        className="flex-1 py-3 px-6 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#cc0000]/5 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <div className="w-6 h-6 bg-[#cc0000]/10 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <rect x="6" y="6" width="12" height="12" />
                                            </svg>
                                        </div>
                                        Capture Image
                                    </button>
                                </div>

                                {/* Error message */}
                                {error && (
                                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                                        {error}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    onClick={submitImage}
                                    disabled={isProcessing || !image}
                                    className={`w-full py-4 bg-[#cc0000] text-white rounded-full font-medium shadow-sm transition-colors
                                        ${(isProcessing || !image) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#aa0000]'}`}
                                >
                                    {isProcessing ? 'Processing...' : 'Submit Receipt'}
                                </button>

                                {/* Manual Entry Link */}
                                <div className="mt-8 text-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-[#E2E8F0]"></div>
                                        </div>
                                        <div className="relative flex justify-center">
                                            <button
                                                onClick={handleSetManual}
                                                className="px-4 py-2 bg-white text-[#64748B] hover:text-[#cc0000] transition-colors font-bold"
                                            >
                                                No Receipt? Enter Manually
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center mb-8 relative">
                                    <button
                                        onClick={() => {
                                            setManual(false);
                                            setManualAmount('');
                                            setError(null);
                                        }}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-[#cc0000] hover:text-[#aa0000] transition-colors"
                                        aria-label="Back to receipt upload"
                                    >
                                        <ArrowLeft className="w-6 h-6" />
                                    </button>
                                    <h2 className="text-xl font-semibold text-[#334155] mb-2">Enter Total Amount</h2>
                                    <p className="text-[#64748B]">Please enter the total amount from your receipt</p>
                                </div>

                                <div className="space-y-4">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Enter total amount"
                                        value={manualAmount}
                                        onChange={(e) => setManualAmount(e.target.value)}
                                        className="w-full py-3 px-6 border-2 border-[#E2E8F0] rounded-full focus:border-[#cc0000] focus:ring-2 focus:ring-[#cc0000]/20 transition-colors"
                                    />

                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        onClick={submitManualTotal}
                                        disabled={!manualAmount || isProcessing}
                                        className={`w-full py-4 bg-[#cc0000] text-white rounded-full font-medium shadow-sm transition-colors
                                            ${(!manualAmount || isProcessing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#aa0000]'}`}
                                    >
                                        {isProcessing ? 'Processing...' : 'Submit Total'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}