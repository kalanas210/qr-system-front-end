import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, User, Phone, MapPin } from 'lucide-react';

interface QRData {
  qrcode: {
    serialNumber: string;
    productId: string;
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
}

const ActivationForm: React.FC = () => {
  const { serialNumber } = useParams<{ serialNumber: string }>();
  const navigate = useNavigate();
  const [qrData, setQRData] = useState<QRData | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchQRData = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/qr/${serialNumber}`);
      const data = await response.json();

      if (response.ok) {
        setQRData(data);
      } else {
        setError(data.message || 'QR code not found');
      }
    } catch {
      setError('Failed to fetch QR code information');
    }
  }, [serialNumber]);

  useEffect(() => {
    const token = localStorage.getItem('shopToken');
    if (!token) {
      navigate(`/shop/login/${serialNumber}`);
      return;
    }
    
    fetchQRData();
  }, [serialNumber, navigate, fetchQRData]);

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('shopToken');
    if (!token) {
      navigate(`/shop/login/${serialNumber}`);
      return;
    }

    try {
      const response = await fetch(`/api/public/qr/${serialNumber}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName,
          customerAddress,
          customerPhone
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem('shopToken');
        navigate(`/warranty/${serialNumber}`);
      } else {
        setError(data.message || 'Activation failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!qrData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Activate Product Warranty</h1>
            <p className="text-gray-600">
              QR Code: <span className="font-semibold">{qrData.qrcode.serialNumber}</span>
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <img
                src={qrData.product.imageUrl}
                alt={qrData.product.productName}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{qrData.product.productName}</h3>
                <p className="text-sm text-gray-600">{qrData.product.manufacturer}</p>
                <p className="text-sm text-gray-600">{qrData.product.category}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">
                    <strong>Warranty Duration:</strong> {qrData.product.warrantyDuration} days
                  </p>
                </div>
                {qrData.shop && (
                  <div>
                    <p className="text-gray-600">
                      <strong>Activated by:</strong> {qrData.shop.shopName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleActivation} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide customer details for warranty registration (optional but recommended)
              </p>
            </div>

            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Customer Name
              </label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Customer Phone
              </label>
              <input
                type="tel"
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter customer phone number"
              />
            </div>

            <div>
              <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Customer Address
              </label>
              <textarea
                id="customerAddress"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter customer address"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Activating Warranty...' : 'Activate Warranty'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ActivationForm;