import React, { useState } from 'react';
import Image from 'next/image';
import { CreditCard, Plus, Trash2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
}

interface WalletComponentProps {
  paymentMethods: PaymentMethod[];
  onAddCard: () => void;
  onRemoveCard: (id: string) => void;
}

const WalletComponent: React.FC<WalletComponentProps> = ({
  paymentMethods,
  onAddCard,
  onRemoveCard,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '/images/visa.svg';
      case 'mastercard':
        return '/images/mastercard.svg';
      case 'amex':
        return '/images/amex.svg';
      default:
        return '/images/generic-card.svg';
    }
  };

  const handleDeleteClick = (id: string) => {
    setShowConfirmDelete(id);
  };

  const handleConfirmDelete = (id: string) => {
    onRemoveCard(id);
    setShowConfirmDelete(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Payment Methods</h2>
        <button
          onClick={onAddCard}
          className="flex items-center text-[#BA2525] hover:text-[#a01f1f] transition-colors"
        >
          <Plus className="w-5 h-5 mr-1" />
          Add Card
        </button>
      </div>

      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="relative w-12 h-8">
                <Image
                  src={getCardIcon(method.brand)}
                  alt={method.brand}
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  •••• {method.last4}
                </p>
                <p className="text-sm text-gray-500">
                  Expires {method.expMonth}/{method.expYear}
                </p>
              </div>
            </div>

            {showConfirmDelete === method.id ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleConfirmDelete(method.id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowConfirmDelete(null)}
                  className="text-gray-500 hover:text-gray-600 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleDeleteClick(method.id)}
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}

        {paymentMethods.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No payment methods added yet</p>
            <p className="text-sm mt-1">
              Add a card to enable automatic payments for your dates
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-gray-200 pt-4">
        <p className="text-sm text-gray-500">
          Your payment information is securely stored and processed by Stripe.
          We never store your full card details.
        </p>
      </div>
    </div>
  );
};

export default WalletComponent; 