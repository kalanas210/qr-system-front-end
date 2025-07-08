import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, Package, Store, Clock, CheckCircle, Phone, User, Calendar } from 'lucide-react';

interface WarrantyData {
  status: string;
  qrcode: {
    serialNumber: string;
    productId: string;
    isActivated: boolean;
    activationDate: string;
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
  };
  warrantyEndDate: string;
  remainingDays: number;
}

const WarrantyInfo: React.FC = () => {
  const { serialNumber } = useParams<{ serialNumber: string }>();
  const [warrantyData, setWarrantyData] = useState<WarrantyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (serialNumber) {
      fetchWarrantyData();
    }
  }, [serialNumber]);

  const fetchWarrantyData = async () => {
    try {
      const response = await fetch(`/api/public/qr/${serialNumber}`);
      const data = await response.json();

      if (response.ok) {
        setWarrantyData(data);
      } else {
        setError(data.message || 'Warranty information not found');
      }
    } catch {
      setError('Failed to fetch warranty information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading warranty information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Warranty Error</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!warrantyData) {
    return null;
  }

  const isWarrantyExpired = warrantyData.remainingDays <= 0;
  const isWarrantyNearExpiry = warrantyData.remainingDays <= 30 && warrantyData.remainingDays > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className={`p-6 ${isWarrantyExpired ? 'bg-red-50' : isWarrantyNearExpiry ? 'bg-yellow-50' : 'bg-green-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className={`w-8 h-8 ${isWarrantyExpired ? 'text-red-600' : isWarrantyNearExpiry ? 'text-yellow-600' : 'text-green-600'}`} />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Product Warranty</h1>
                  <p className="text-gray-600">Serial: {warrantyData.qrcode.serialNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isWarrantyExpired 
                    ? 'bg-red-100 text-red-800' 
                    : isWarrantyNearExpiry 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                }`}>
                  {isWarrantyExpired ? 'Expired' : isWarrantyNearExpiry ? 'Expires Soon' : 'Active'}
                </div>
              </div>
            </div>
          </div>

          {/* Warranty Status */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Activation Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(warrantyData.qrcode.activationDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-center">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Warranty Period</p>
                <p className="text-lg font-semibold text-gray-900">
                  {warrantyData.product.warrantyDuration} days
                </p>
              </div>
              <div className="text-center">
                <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${isWarrantyExpired ? 'text-red-600' : 'text-green-600'}`} />
                <p className="text-sm text-gray-600">Days Remaining</p>
                <p className={`text-lg font-semibold ${isWarrantyExpired ? 'text-red-600' : 'text-green-600'}`}>
                  {warrantyData.remainingDays > 0 ? warrantyData.remainingDays : 0}
                </p>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
            <div className="flex items-start space-x-4">
              <img
                src={warrantyData.product.imageUrl}
                alt={warrantyData.product.productName}
                className="w-24 h-24 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {warrantyData.product.productName}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <p className="text-gray-600">
                    <strong>Manufacturer:</strong> {warrantyData.product.manufacturer}
                  </p>
                  <p className="text-gray-600">
                    <strong>Category:</strong> {warrantyData.product.category}
                  </p>
                  <p className="text-gray-600">
                    <strong>Product ID:</strong> {warrantyData.qrcode.productId}
                  </p>
                  <p className="text-gray-600">
                    <strong>Warranty Expires:</strong> {new Date(warrantyData.warrantyEndDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Shop Information */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Authorized Retailer</h3>
            <div className="flex items-center space-x-4">
              <Store className="w-8 h-8 text-blue-600" />
              <div>
                <h4 className="font-semibold text-gray-900">{warrantyData.shop.shopName}</h4>
                <p className="text-sm text-gray-600">Owner: {warrantyData.shop.ownerName}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{warrantyData.shop.phoneNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          {(warrantyData.qrcode.customerName || warrantyData.qrcode.customerPhone || warrantyData.qrcode.customerAddress) && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {warrantyData.qrcode.customerName && (
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{warrantyData.qrcode.customerName}</p>
                    </div>
                  </div>
                )}
                {warrantyData.qrcode.customerPhone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{warrantyData.qrcode.customerPhone}</p>
                    </div>
                  </div>
                )}
                {warrantyData.qrcode.customerAddress && (
                  <div className="flex items-start space-x-3 md:col-span-2">
                    <Package className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium text-gray-900">{warrantyData.qrcode.customerAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Support Information */}
          <div className="p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Support & Service</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Warranty Claims</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Contact your authorized retailer for warranty claims and repairs.
                </p>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">{warrantyData.shop.phoneNumber}</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Important Notes</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Keep this QR code for warranty claims</li>
                  <li>• Original purchase proof may be required</li>
                  <li>• Contact retailer before warranty expires</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarrantyInfo;