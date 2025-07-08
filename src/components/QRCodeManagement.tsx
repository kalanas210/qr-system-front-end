import React, { useState, useEffect } from 'react';
import { QrCode, Plus, Download, Package, Store, ChevronDown, ChevronRight, CheckSquare, Square, Search, Filter, X, Trash2 } from 'lucide-react';

interface QRCodeData {
  _id: string;
  serialNumber: string;
  productId: string;
  batchId: string;
  assignedShopId: string | null;
  isActivated: boolean;
  activationDate: string | null;
  createdAt: string;
}

interface BatchData {
  _id: string;
  productId: string;
  count: number;
  activatedCount: number;
  assignedCount: number;
  createdAt: string;
}

interface Product {
  _id: string;
  productId: string;
  productName: string;
}

interface Shop {
  _id: string;
  shopId: string;
  shopName: string;
}

interface QRCodeManagementProps {
  token: string;
  onStatsUpdate: () => void;
}

const QRCodeManagement: React.FC<QRCodeManagementProps> = ({ token, onStatsUpdate }) => {
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedQRCodes, setSelectedQRCodes] = useState<string[]>([]);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [batchQRCodes, setBatchQRCodes] = useState<Record<string, QRCodeData[]>>({});
  const [generateForm, setGenerateForm] = useState({
    productId: '',
    quantity: 1
  });
  const [assignForm, setAssignForm] = useState({
    shopId: ''
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [shopFilter, setShopFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Add at the top, after other useState hooks
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const paperPresets = [
    { label: 'A4 (8.27 x 11.69 in)', value: 'A4', width: 8.27, height: 11.69 },
    { label: 'A3 (11.69 x 16.54 in)', value: 'A3', width: 11.69, height: 16.54 },
    { label: 'A5 (5.83 x 8.27 in)', value: 'A5', width: 5.83, height: 8.27 },
    { label: '13 x 19 in', value: '13x19', width: 13, height: 19 },
    { label: '48 in Roll (48 x 13 in)', value: '48roll', width: 48, height: 13 },
    { label: 'Custom', value: 'custom' },
  ];

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState({
    paperSize: 'A4',
    customWidth: 8.27,
    customHeight: 11.69,
    copiesPerProduct: 2,
    margin: 40,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;


  const fetchData = async () => {
    try {
      const [batchesResponse, productsResponse, shopsResponse] = await Promise.all([
        fetch(`${baseUrl}/api/admin/qrcodes/batches`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/admin/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/admin/shops`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (batchesResponse.ok) {
        const batchesData = await batchesResponse.json();
        setBatches(batchesData);
      }

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData);
      }

      if (shopsResponse.ok) {
        const shopsData = await shopsResponse.json();
        setShops(shopsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchQRCodes = async (batchId: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/admin/qrcodes/batch/${batchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const qrcodes = await response.json();
        setBatchQRCodes(prev => ({
          ...prev,
          [batchId]: qrcodes
        }));
      }
    } catch (error) {
      console.error('Error fetching batch QR codes:', error);
    }
  };

  const toggleBatchExpansion = (batchId: string) => {
    const newExpanded = new Set(expandedBatches);
    if (newExpanded.has(batchId)) {
      newExpanded.delete(batchId);
    } else {
      newExpanded.add(batchId);
      // Fetch QR codes for this batch if not already loaded
      if (!batchQRCodes[batchId]) {
        fetchBatchQRCodes(batchId);
      }
    }
    setExpandedBatches(newExpanded);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${baseUrl}/api/admin/qrcodes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(generateForm)
      });

      if (response.ok) {
        await fetchData();
        onStatsUpdate();
        setShowGenerateForm(false);
        setGenerateForm({ productId: '', quantity: 1 });
      }
    } catch (error) {
      console.error('Error generating QR codes:', error);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${baseUrl}/api/admin/qrcodes/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          qrIds: selectedQRCodes,
          shopId: assignForm.shopId
        })
      });

      if (response.ok) {
        // Refresh all expanded batches
        const expandedBatchIds = Array.from(expandedBatches);
        for (const batchId of expandedBatchIds) {
          await fetchBatchQRCodes(batchId);
        }
        await fetchData();
        setShowAssignForm(false);
        setSelectedQRCodes([]);
        setAssignForm({ shopId: '' });
      }
    } catch (error) {
      console.error('Error assigning QR codes:', error);
    }
  };

  const handleFlexibleDownload = async () => {
    if (selectedQRCodes.length === 0) {
      alert('Please select QR codes to download');
      return;
    }
    setShowDownloadModal(true);
  };

  const submitFlexibleDownload = async () => {
    setShowDownloadModal(false);
    let paperSizeParam;
    if (downloadOptions.paperSize === 'custom') {
      paperSizeParam = {
        width: parseFloat(downloadOptions.customWidth.toString()),
        height: parseFloat(downloadOptions.customHeight.toString()),
      };
    } else {
      paperSizeParam = downloadOptions.paperSize;
    }
    try {
      const response = await fetch(`${baseUrl}/api/admin/qrcodes/flexible-sticker-sheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          qrIds: selectedQRCodes,
          paperSize: paperSizeParam,
          copiesPerProduct: parseInt(downloadOptions.copiesPerProduct.toString()),
          margin: parseInt(downloadOptions.margin.toString())
        })
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Stickers-${selectedQRCodes.length}-items.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to download PDF');
      }
    } catch (error) {
      alert('Failed to download PDF. Please try again.');
    }
  };

  const toggleQRSelection = (qrId: string) => {
    setSelectedQRCodes(prev => 
      prev.includes(qrId) 
        ? prev.filter(id => id !== qrId)
        : [...prev, qrId]
    );
  };

  const selectAllInBatch = (batchId: string) => {
    const batchCodes = batchQRCodes[batchId] || [];
    const allSelected = batchCodes.every(qr => selectedQRCodes.includes(qr._id));
    
    if (allSelected) {
      // Deselect all in this batch
      setSelectedQRCodes(prev => prev.filter(id => 
        !batchCodes.some(qr => qr._id === id)
      ));
    } else {
      // Select all in this batch
      const batchIds = batchCodes.map(qr => qr._id);
      setSelectedQRCodes(prev => {
        const withoutBatch = prev.filter(id => 
          !batchCodes.some(qr => qr._id === id)
        );
        return [...withoutBatch, ...batchIds];
      });
    }
  };

  const selectAllVisible = () => {
    // Get all visible QR codes from all expanded batches
    const allVisibleQRCodes = Array.from(expandedBatches).flatMap(batchId => {
      const batchCodes = batchQRCodes[batchId] || [];
      return filteredQRCodes(batchCodes).map(qr => qr._id);
    });
    
    const allSelected = allVisibleQRCodes.every(qrId => selectedQRCodes.includes(qrId));
    
    if (allSelected) {
      // Deselect all visible
      setSelectedQRCodes(prev => prev.filter(id => !allVisibleQRCodes.includes(id)));
    } else {
      // Select all visible
      setSelectedQRCodes(prev => {
        const withoutVisible = prev.filter(id => !allVisibleQRCodes.includes(id));
        return [...withoutVisible, ...allVisibleQRCodes];
      });
    }
  };

  const getShopName = (shopId: string | null) => {
    if (!shopId) return 'Not assigned';
    const shop = shops.find(s => s.shopId === shopId);
    return shop ? shop.shopName : shopId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter functions
  const filteredBatches = batches.filter(batch => {
    const product = products.find(p => p.productId === batch.productId);
    const productName = product ? product.productName.toLowerCase() : '';
    
    // Search filter
    if (searchTerm && !productName.includes(searchTerm.toLowerCase()) && 
        !batch._id.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Product filter
    if (productFilter !== 'all' && batch.productId !== productFilter) {
      return false;
    }
    
    return true;
  });

  const filteredQRCodes = (qrcodes: QRCodeData[]) => {
    return qrcodes.filter(qrcode => {
      // Search filter
      if (searchTerm && !qrcode.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter === 'activated' && !qrcode.isActivated) return false;
      if (statusFilter === 'pending' && qrcode.isActivated) return false;
      
      // Shop filter
      if (shopFilter !== 'all') {
        if (shopFilter === 'unassigned' && qrcode.assignedShopId !== null) return false;
        if (shopFilter !== 'unassigned' && qrcode.assignedShopId !== shopFilter) return false;
      }
      
      return true;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setProductFilter('all');
    setShopFilter('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || productFilter !== 'all' || shopFilter !== 'all';

  // Add these functions inside the component
  const handleDeleteBatch = async (batchId: string) => {
    if (!window.confirm('Are you sure you want to delete this entire batch? This cannot be undone.')) return;
    setDeletingBatchId(batchId);
    setDeleteError('');
    try {
      const response = await fetch(`${baseUrl}/api/admin/qrcodes/batch/${batchId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchData();
        onStatsUpdate();
      } else {
        const data = await response.json();
        setDeleteError(data.message || 'Failed to delete batch');
      }
    } catch (error) {
      setDeleteError('Network error. Please try again.');
    } finally {
      setDeletingBatchId(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedQRCodes.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedQRCodes.length} selected QR code(s)? This cannot be undone.`)) return;
    setDeletingSelected(true);
    setDeleteError('');
    try {
      const response = await fetch(`${baseUrl}/api/admin/qrcodes`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ qrIds: selectedQRCodes })
      });
      if (response.ok) {
        await fetchData();
        setSelectedQRCodes([]);
        onStatsUpdate();
      } else {
        const data = await response.json();
        setDeleteError(data.message || 'Failed to delete selected QR codes');
      }
    } catch (error) {
      setDeleteError('Network error. Please try again.');
    } finally {
      setDeletingSelected(false);
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">QR Code Management</h2>
          {selectedQRCodes.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {selectedQRCodes.length} QR code(s) selected
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowGenerateForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Generate QR Codes</span>
          </button>
          {selectedQRCodes.length > 0 && (
            <>
              <button
                onClick={() => setShowAssignForm(true)}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Store className="w-5 h-5" />
                <span>Assign {selectedQRCodes.length} QR Code(s)</span>
              </button>
              <button
                onClick={handleFlexibleDownload}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Download Stickers ({selectedQRCodes.length})</span>
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                disabled={deletingSelected}
              >
                <Trash2 className="w-5 h-5" />
                <span>{deletingSelected ? 'Deleting...' : `Delete ${selectedQRCodes.length} QR Code(s)`}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Search & Filters</h3>
          <div className="flex items-center space-x-4">
            {expandedBatches.size > 0 && (
              <button
                onClick={selectAllVisible}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                {selectedQRCodes.length > 0 ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>Select All Visible</span>
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <Filter className="w-4 h-4" />
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by serial number, product name, or batch ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="activated">Activated</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Products</option>
                {products.map(product => (
                  <option key={product._id} value={product.productId}>
                    {product.productName}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shop Assignment</label>
              <select
                value={shopFilter}
                onChange={(e) => setShopFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Shops</option>
                <option value="unassigned">Unassigned</option>
                {shops.map(shop => (
                  <option key={shop._id} value={shop.shopId}>
                    {shop.shopName}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Active filters:</span>
            {searchTerm && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Search: "{searchTerm}"
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Status: {statusFilter}
              </span>
            )}
            {productFilter !== 'all' && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                Product: {products.find(p => p.productId === productFilter)?.productName}
              </span>
            )}
            {shopFilter !== 'all' && (
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                Shop: {shopFilter === 'unassigned' ? 'Unassigned' : shops.find(s => s.shopId === shopFilter)?.shopName}
              </span>
            )}
          </div>
        )}
      </div>

      {showGenerateForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate QR Codes</h3>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product
                </label>
                <select
                  value={generateForm.productId}
                  onChange={(e) => setGenerateForm({ ...generateForm, productId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product._id} value={product.productId}>
                      {product.productName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={generateForm.quantity}
                  onChange={(e) => setGenerateForm({ ...generateForm, quantity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="1000"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate QR Codes
              </button>
              <button
                type="button"
                onClick={() => setShowGenerateForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showAssignForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Assign {selectedQRCodes.length} QR Code(s) to Shop
          </h3>
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop
              </label>
              <select
                value={assignForm.shopId}
                onChange={(e) => setAssignForm({ ...assignForm, shopId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a shop</option>
                {shops.map(shop => (
                  <option key={shop._id} value={shop.shopId}>
                    {shop.shopName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Assign QR Codes
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAssignForm(false);
                  setSelectedQRCodes([]);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-2">
          <p className="text-red-600 text-sm">{deleteError}</p>
        </div>
      )}

      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Download Sticker Sheet</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Paper Size</label>
              <select
                value={downloadOptions.paperSize}
                onChange={e => setDownloadOptions(opt => ({ ...opt, paperSize: e.target.value }))}
                className="w-full border rounded px-2 py-1"
              >
                {paperPresets.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            {downloadOptions.paperSize === 'custom' && (
              <div className="flex space-x-2 mb-4">
                <div>
                  <label className="block text-xs mb-1">Width (inches)</label>
                  <input type="number" min="1" step="0.01" value={downloadOptions.customWidth.toString()}
                    onChange={e => setDownloadOptions(opt => ({ ...opt, customWidth: parseFloat(e.target.value) }))}
                    className="border rounded px-2 py-1 w-24" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Height (inches)</label>
                  <input type="number" min="1" step="0.01" value={downloadOptions.customHeight.toString()}
                    onChange={e => setDownloadOptions(opt => ({ ...opt, customHeight: parseFloat(e.target.value) }))}
                    className="border rounded px-2 py-1 w-24" />
                </div>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Copies per Product</label>
              <input type="number" min="1" max="10" value={downloadOptions.copiesPerProduct.toString()}
                onChange={e => setDownloadOptions(opt => ({ ...opt, copiesPerProduct: parseInt(e.target.value) }))}
                className="border rounded px-2 py-1 w-24" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Margin (points)</label>
              <input type="number" min="0" max="200" value={downloadOptions.margin.toString()}
                onChange={e => setDownloadOptions(opt => ({ ...opt, margin: parseInt(e.target.value) }))}
                className="border rounded px-2 py-1 w-24" />
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowDownloadModal(false)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
              <button onClick={submitFlexibleDownload} className="px-4 py-2 rounded bg-purple-600 text-white">Download</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">QR Code Batches</h3>
          <div className="text-sm text-gray-500">
            Showing {filteredBatches.length} of {batches.length} batches
          </div>
        </div>
        
        {filteredBatches.length === 0 ? (
          <div className="text-center py-8">
            <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {hasActiveFilters ? 'No batches match your filters. Try adjusting your search criteria.' : 'No QR code batches found. Generate your first batch!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBatches.map(batch => {
              const product = products.find(p => p.productId === batch.productId);
              const isExpanded = expandedBatches.has(batch._id);
              const batchCodes = batchQRCodes[batch._id] || [];
              const filteredBatchCodes = filteredQRCodes(batchCodes);
              const allSelected = filteredBatchCodes.length > 0 && filteredBatchCodes.every(qr => selectedQRCodes.includes(qr._id));
              
              return (
                <div key={batch._id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Batch Header */}
                  <div 
                    className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleBatchExpansion(batch._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <Package className="w-5 h-5 text-blue-600" />
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {product ? product.productName : batch.productId}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Batch ID: {batch._id} • Generated: {formatDate(batch.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {filteredBatchCodes.length} of {batch.count} QR Codes
                          </div>
                          <div className="text-xs text-gray-500">
                            {batch.activatedCount} activated • {batch.assignedCount} assigned
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteBatch(batch._id); }}
                            className="flex items-center space-x-1 bg-red-100 text-red-700 px-2 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                            disabled={deletingBatchId === batch._id}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{deletingBatchId === batch._id ? 'Deleting...' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-medium text-gray-900">
                          QR Codes in this batch ({filteredBatchCodes.length} shown)
                        </h5>
                        {filteredBatchCodes.length > 0 && (
                          <button
                            onClick={() => selectAllInBatch(batch._id)}
                            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            {allSelected ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                            <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
                          </button>
                        )}
                      </div>
                      
                      {filteredBatchCodes.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">No QR codes match your current filters.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                          {filteredBatchCodes.map(qrcode => (
                            <div 
                              key={qrcode._id} 
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedQRCodes.includes(qrcode._id)
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => toggleQRSelection(qrcode._id)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">{qrcode.serialNumber}</span>
                                <QrCode className="w-4 h-4 text-gray-400" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-gray-600">
                                  <strong>Shop:</strong> {getShopName(qrcode.assignedShopId)}
                                </p>
                                <p className="text-xs text-gray-600">
                                  <strong>Status:</strong> 
                                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                                    qrcode.isActivated 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {qrcode.isActivated ? 'Activated' : 'Pending'}
                                  </span>
                                </p>
                                {qrcode.activationDate && (
                                  <p className="text-xs text-gray-600">
                                    <strong>Activated:</strong> {new Date(qrcode.activationDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeManagement;