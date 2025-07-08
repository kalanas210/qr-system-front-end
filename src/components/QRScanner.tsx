import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode } from 'lucide-react';

interface QRData {
  status: 'needs_activation' | 'activated';
  qrcode: {
    serialNumber: string;
    productId: string;
    assignedShopId: string | null;
    isActivated: boolean;
    activationDate: string | null;
    customerName: string | null;
    customerAddress: string | null;
    customerPhone: string | null;
  };
  product: {
    productName: string;
    manufacturer: string;
    category: string;
    imageUrl: string;
    warrantyDuration: number;
  };
  shop: {
    shopName: string;
    ownerName: string;
    phoneNumber: string;
  } | null;
  warrantyEndDate?: string;
  remainingDays?: number;
}

const QRScanner: React.FC = () => {
  const { serialNumber } = useParams<{ serialNumber: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (serialNumber) {
      fetchQRData();
    }
  }, [serialNumber]);

  const fetchQRData = async () => {
    try {
      const response = await fetch(`/api/public/qr/${serialNumber}`);
      const data = await response.json();

      if (response.ok) {
        // Redirect based on status
        if (data.status === 'needs_activation') {
          navigate(`/shop/login/${serialNumber}`);
        } else {
          navigate(`/warranty/${serialNumber}`);
        }
      } else {
        setError(data.message || 'QR code not found');
      }
    } catch {
      setError('Failed to fetch QR code information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading QR code information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <QrCode className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">QR Code Error</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return null; // This component will redirect, so no UI needed
};

export default QRScanner;