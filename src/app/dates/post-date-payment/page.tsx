'use client';

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/supabase/client";

export default function ReceiptCapture() {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [manual, setManual] = useState<boolean>(false);
    const [manualAmount, setManualAmount] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null); //stores a reference to the file input field (starts out as null)
    const videoRef = useRef<HTMLVideoElement | null>(null); //stores a reference to the video element, for the camera stream.
    const canvasRef = useRef<HTMLCanvasElement | null>(null); //stores a reference to the canvas element
    const router = useRouter();

    // Start Camera for Scanning
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({video: true}); //Requests access to the device's camera. Returns a media stream object that can be used to 
                          
            
            if (videoRef.current) {
                //Sets the <video> element to display the live camera feed.
                videoRef.current.srcObject = stream;

            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Failed to access camera. Please check permissions.');
        }
    };

    // Capture Image from Camera
    const captureImage = () => {
        if (!videoRef.current || !canvasRef.current) return; //Prevents null reference errors.
        const canvas = canvasRef.current;
        const video = videoRef.current;

        // Retrieves the 2D drawing context from the <canvas> element.
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Failed to get 2D context');
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draws the current frame from the video stream onto the canvas.
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Extracts the image data from the canvas and converts it to a Blob object (Binary Large Object)
        // The first argument is a callback function that receives the blob object once it's ready.
        // The second argument is the MIME type of the image (JPEG).
        // The third argument is the quality of the image (0-1).
        canvas.toBlob((blob) => {
            if (blob) {
                //Wraps the blob into a File object so it can be processed as an image
                const file = new File([blob], 'receipt.jpg', {type: 'image/jpeg'});

                // Ensure state updates in an async-safe manner:
                    // Defers the state update until the next event loop tick
                    // Prevents React from tryng to update state while rendering another component (Hot Reload)
                
                setTimeout(() => {
                    setImage(file);
                    setPreview(URL.createObjectURL(file)); 
                }, 0);
            }
        }, 'image/jpeg', 0.8);
    };

    // Handle Manual Image Upload
    // Detects if a change has been made to the file input (which is of type HTMLInputElement). Triggered when the user selects a file from their device.
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        // Make sure the file is an image
        if (!file || !file.type.startsWith('image/')) {
            setError('Invalid file type. Please upload an image file.');
            return;
        }

        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // Submit Image for OCR Processing
    const submitImage = async () => {
        if (!image) return;

        setIsProcessing(true);
        setError(null);

        const formData = new FormData(); 
        formData.append('file', image);

        try {
            // Call actual API route to process image
            const response = await fetch('/api/process-receipt', {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Failed to process receipt. Please try again.");

            // OCR API will return JSON with expense details from the receipt 
            const data = await response.json();
            console.log("OCR Response:", data);

            // Store receipt data in Supabase
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No active session");

            const { error: insertError } = await supabase
                .from('receipts')
                .insert({
                    user_id: session.user.id,
                    merchant: data.receipt.merchant,
                    total_amount: data.receipt.total,
                    items: data.receipt.items,
                    date: new Date().toISOString(),
                    receipt_image_url: data.receipt.imageUrl,
                    ophelia_fee: data.receipt.total * 0.15 // 15% service fee
                });

            if (insertError) throw insertError;

            // store receipt in localStorage for the confirmation page
            localStorage.setItem('receipt', JSON.stringify(data.receipt));

            // Redirect to confirm page
            router.push(`/dates/post-date-payment/confirm`);
        } catch (err) {
            console.error('OCR Processing Error:', err);
            setError('Failed to process receipt. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSetManual = () => {
        setManual(true);
    };
        
    const submitManualTotal = async () => {
        if (!manualAmount) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Store manual receipt data in Supabase
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No active session");

            const { error: insertError } = await supabase
                .from('receipts')
                .insert({
                    user_id: session.user.id,
                    total_amount: manualAmount,
                    date: new Date().toISOString(),
                    ophelia_fee: manualAmount * 0.15 // 15% service fee
                });

            if (insertError) throw insertError;

            router.push(`/dates/post-date-payment/confirm?amount=${manualAmount}`);
        } catch (err) {
            console.error('Error storing manual amount:', err);
            setError('Failed to process amount. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
            {!manual ? (
                <>
                <h2 className="text-center text-[#cc0000] font-bold text-2xl mb-4">Upload or Scan Your Receipt</h2>

                <video ref={videoRef} autoPlay playsInline className="w-full mb-4 rounded-md shadow-sm" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Camera start and capture */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={startCamera}
                        className="w-1/2 py-3 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 transition"
                    >
                        Start Camera
                    </button>
                    <button
                        onClick={captureImage}
                        className="w-1/2 py-3 bg-green-500 text-white rounded-md font-medium hover:bg-green-600 transition"
                    >
                        Capture Image
                    </button>
                </div>

                {/* File input */}
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="mb-4" />

                {/* Image preview */}
                {preview && 
                    <Image 
                        src={preview} 
                        alt="Receipt Preview" 
                        width={300} 
                        height={400} 
                        layout="intrinsic" // allows automatic resizing
                        objectFit="contain" // Prevents image distortion
                        className="w-full h-auto rounded-md shadow-md mb-4" 
                    />
                }


                {/* Error message */}
                {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

                {/* Submit */}
                <button
                onClick={submitImage}
                disabled={isProcessing}
                className={`w-full py-3 bg-[#cc0000] text-white rounded-md font-medium transition
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#aa0000]'}`}
                >
                {isProcessing ? 'Processing...' : 'Submit Receipt'}
                </button>
                </>
            ) : (
                <>
                    <h2 className="text-center text-[#cc0000] font-bold text-2xl mb-4">Enter Total Amount</h2>
                    <label className="block mb-2 font-semibold">Enter the total amount from your receipt:</label>
                    <input
                        type="number"
                        placeholder="Total Amount"
                        className="w-full py-3 px-4 border border-gray-300 rounded-md mb-4"
                        value={manualAmount ?? ''}
                        onChange={(e) => setManualAmount(parseFloat(e.target.value))}
                    />
                    <button
                        onClick={submitManualTotal}
                        disabled={isProcessing || !manualAmount}
                        className={`w-full py-3 bg-[#cc0000] text-white rounded-md font-medium transition
                            ${isProcessing || !manualAmount ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#aa0000]'}`}
                    >
                        {isProcessing ? 'Processing...' : 'Submit Total'}
                    </button>
                </>
            )}
            { !manual && (
            <button
            onClick={handleSetManual}
            className={`w-full py-3 bg-[#cc0000] text-white mt-8 rounded-md font-medium transition`}
            >
            No Receipt? Enter Manually
            </button>
            )}

        </div>
    );
}