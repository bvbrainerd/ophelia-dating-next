'use client'

import { useState } from 'react'

interface DateType {
  name: string
  price: number
  venue: string
  date: string
  time: string
}

interface PaymentPageProps {
  selectedDate: DateType
  onConfirm: () => void
  onCancel: () => void
}

export default function PaymentPage({ selectedDate, onConfirm, onCancel }: PaymentPageProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      onConfirm()
    } catch (error) {
      alert('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-5">
      <h2 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Confirm Your Date
      </h2>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-[#cc0000] text-xl font-medium mb-2">
          Date Details
        </h3>
        <p className="mb-1">
          <strong>With:</strong> {selectedDate.name}
        </p>
        <p className="mb-1">
          <strong>When:</strong> {selectedDate.date}, {selectedDate.time}
        </p>
        <p className="mb-1">
          <strong>Where:</strong> {selectedDate.venue}
        </p>
        <p className="text-xl font-medium mt-3">
          Total: ${selectedDate.price}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Card Number</label>
          <input
            className="w-full p-2.5 border border-gray-200 rounded-full outline-none"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Expiry Date</label>
            <input
              className="w-full p-2.5 border border-gray-200 rounded-full outline-none"
              type="text"
              placeholder="MM/YY"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">CVV</label>
            <input
              className="w-full p-2.5 border border-gray-200 rounded-full outline-none"
              type="text"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              required
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={isProcessing}
          className={`w-full p-3 bg-[#cc0000] text-white rounded-full font-medium transition-colors mt-6 
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#aa0000]'}`}
        >
          {isProcessing ? 'Processing...' : `Pay $${selectedDate.price}`}
        </button>
      </form>

      <button 
        className="w-full p-3 mt-4 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
        onClick={onCancel}
        disabled={isProcessing}
      >
        Cancel
      </button>
    </div>
  )
}