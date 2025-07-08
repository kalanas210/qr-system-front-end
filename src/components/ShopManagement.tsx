import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Store, Phone, User, ChevronDown, ChevronRight } from 'lucide-react';

interface Shop {
  _id: string;
  shopId: string;
  shopName: string;
  ownerName: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
}

interface ShopManagementProps {
  token: string;
  onStatsUpdate: () => void;
}

const ShopManagement: React.FC<ShopManagementProps> = ({ token, onStatsUpdate }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    phoneNumber: '',
    password: ''
  });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
  const [shopQRCodes, setShopQRCodes] = useState<Record<string, any[]>>({});
  const [shopQRCodesLoading, setShopQRCodesLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/admin/shops', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setShops(data);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    const url = editingShop 
      ? `/api/admin/shops/${editingShop._id}`
      : '/api/admin/shops';
    
    const method = editingShop ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        await fetchShops();
        onStatsUpdate();
        setShowForm(false);
        setEditingShop(null);
        setFormData({ shopName: '', ownerName: '', phoneNumber: '', password: '' });
        setSubmitError('');
      } else {
        setSubmitError(data.message || 'Failed to save shop');
      }
    } catch (error) {
      console.error('Error saving shop:', error);
      setSubmitError('Network error. Please check if the server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (shopId: string) => {
    if (window.confirm('Are you sure you want to delete this shop?')) {
      try {
        const response = await fetch(`/api/admin/shops/${shopId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          await fetchShops();
          onStatsUpdate();
        }
      } catch (error) {
        console.error('Error deleting shop:', error);
      }
    }
  };

  const handleEdit = (shop: Shop) => {
    setEditingShop(shop);
    setFormData({
      shopName: shop.shopName,
      ownerName: shop.ownerName,
      phoneNumber: shop.phoneNumber,
      password: ''
    });
    setShowForm(true);
  };

  const handleExpandShop = async (shop: Shop) => {
    if (expandedShopId === shop.shopId) {
      setExpandedShopId(null);
      return;
    }
    setExpandedShopId(shop.shopId);
    if (!shopQRCodes[shop.shopId]) {
      setShopQRCodesLoading(shop.shopId);
      try {
        const response = await fetch(`/api/admin/shops/${shop.shopId}/qrcodes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setShopQRCodes(prev => ({ ...prev, [shop.shopId]: data }));
        }
      } catch (error) {
        // Optionally handle error
      } finally {
        setShopQRCodesLoading(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Shop Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Shop</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingShop ? 'Edit Shop' : 'Add New Shop'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Name
              </label>
              <input
                type="text"
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Name
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password {editingShop && '(leave empty to keep current)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={!editingShop}
              />
            </div>
            {submitError && (
              <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{submitError}</p>
              </div>
            )}
            <div className="md:col-span-2 flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (editingShop ? 'Update Shop' : 'Add Shop')}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setShowForm(false);
                  setEditingShop(null);
                  setFormData({ shopName: '', ownerName: '', phoneNumber: '', password: '' });
                  setSubmitError('');
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shops.map((shop) => (
                <React.Fragment key={shop._id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleExpandShop(shop)}>
                      <div className="flex items-center">
                        {expandedShopId === shop.shopId ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 mr-2" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                        )}
                        <Store className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{shop.shopName}</div>
                          <div className="text-sm text-gray-500">ID: {shop.shopId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-3" />
                        <div className="text-sm text-gray-900">{shop.ownerName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Phone className="w-5 h-5 text-gray-400 mr-3" />
                        <div className="text-sm text-gray-900">{shop.phoneNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        shop.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {shop.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(shop)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(shop._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedShopId === shop.shopId && (
                    <tr>
                      <td colSpan={5} className="bg-gray-50 px-8 py-4">
                        {shopQRCodesLoading === shop.shopId ? (
                          <div className="flex items-center space-x-2 text-gray-500"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div> <span>Loading assigned products...</span></div>
                        ) : (
                          <>
                            {shopQRCodes[shop.shopId] && shopQRCodes[shop.shopId].length > 0 ? (
                              <div>
                                <div className="font-semibold mb-2">Assigned Products</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {Object.entries(
                                    shopQRCodes[shop.shopId].reduce((acc, qr) => {
                                      const key = qr.product?.productId || 'Unknown';
                                      if (!acc[key]) acc[key] = { product: qr.product, total: 0, activated: 0 };
                                      acc[key].total++;
                                      if (qr.isActivated) acc[key].activated++;
                                      return acc;
                                    }, {})
                                  ).map(([productId, info]: any) => (
                                    <div key={productId} className="bg-white border rounded-lg p-4 shadow-sm">
                                      <div className="font-medium text-gray-900">{info.product?.productName || 'Unknown Product'}</div>
                                      <div className="text-sm text-gray-600">Product ID: {productId}</div>
                                      <div className="mt-2 text-xs">
                                        <span className="font-semibold">Assigned:</span> {info.total} <br />
                                        <span className="font-semibold">Activated:</span> {info.activated}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-500">No products assigned to this shop.</div>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShopManagement;