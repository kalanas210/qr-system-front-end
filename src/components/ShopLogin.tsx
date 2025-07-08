import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Store, QrCode } from 'lucide-react';

interface QRData {
  status: string;
  qrcode: {
    serialNumber: string;
    productId: string;
  };
  product: {
    productName: string;
    manufacturer: string;
    imageUrl: string;
  };
  shop: {
    shopName: string;
    ownerName: string;
    phoneNumber: string;
  } | null;
}

const ShopLogin: React.FC = () => {
  const { serialNumber } = useParams<{ serialNumber: string }>();
  const navigate = useNavigate();
  const [qrData, setQRData] = useState<QRData | null>(null);
  const [shopId, setShopId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQRData();
  }, [serialNumber]);

  const fetchQRData = async () => {
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
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/public/shop/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shopId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and redirect to activation form
        localStorage.setItem('shopToken', data.token);
        navigate(`/activate/${serialNumber}`);
      } else {
        setError(data.message || 'Login failed');
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <QrCode className="w-8 h-8 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Product Activation</h1>
          </div>
          <p className="text-gray-600 mb-4">
            QR Code: <span className="font-semibold">{qrData.qrcode.serialNumber}</span>
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <img
              src={qrData.product.imageUrl}
              alt={qrData.product.productName}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{qrData.product.productName}</h3>
              <p className="text-sm text-gray-600">{qrData.product.manufacturer}</p>
            </div>
          </div>
          
          {qrData.shop && (
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Store className="w-4 h-4" />
              <span>Assigned to: {qrData.shop.shopName}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="shopId" className="block text-sm font-medium text-gray-700 mb-2">
              Shop ID
            </label>
            <input
              type="text"
              id="shopId"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your shop ID"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
              required
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
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login & Activate'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShopLogin;