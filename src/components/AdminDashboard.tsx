import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Package, 
  Store, 
  QrCode, 
  LogOut, 
  Users,
  Settings as SettingsIcon,
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react';
import ShopManagement from './ShopManagement';
import ProductManagement from './ProductManagement';
import QRCodeManagement from './QRCodeManagement';
import Settings from './Settings';

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
}

interface DashboardStats {
  totalShops: number;
  totalProducts: number;
  totalQRCodes: number;
  activatedQRCodes: number;
  todayActivations: number;
  topProducts: Array<{
    productName: string;
    activationCount: number;
    imageUrl: string;
  }>;
  weeklyActivations: Array<{
    date: string;
    count: number;
  }>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalShops: 0,
    totalProducts: 0,
    totalQRCodes: 0,
    activatedQRCodes: 0,
    todayActivations: 0,
    topProducts: [],
    weeklyActivations: []
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch dashboard stats:', response.status);
        // Keep existing stats if fetch fails
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Keep existing stats if fetch fails
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'shops', label: 'Shops', icon: Store },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'qrcodes', label: 'QR Codes', icon: QrCode },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  const StatCard: React.FC<{ 
    title: string; 
    value: number; 
    icon: React.ElementType;
    color: string;
  }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-lg h-[calc(100vh-80px)] overflow-y-auto">
          <div className="p-4">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      title="Total Shops"
                      value={stats.totalShops}
                      icon={Store}
                      color="bg-blue-500"
                    />
                    <StatCard
                      title="Total Products"
                      value={stats.totalProducts}
                      icon={Package}
                      color="bg-green-500"
                    />
                    <StatCard
                      title="Total QR Codes"
                      value={stats.totalQRCodes}
                      icon={QrCode}
                      color="bg-purple-500"
                    />
                    <StatCard
                      title="Activated QR Codes"
                      value={stats.activatedQRCodes}
                      icon={Users}
                      color="bg-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* System Overview */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        System Overview
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-2">
                            QR Code Activation Rate
                          </h4>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${stats.totalQRCodes > 0 ? (stats.activatedQRCodes / stats.totalQRCodes) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {stats.totalQRCodes > 0 ? Math.round((stats.activatedQRCodes / stats.totalQRCodes) * 100) : 0}% activated
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-2">
                            System Status
                          </h4>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-600">All systems operational</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Today's Activations */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Today's Activations
                        </h3>
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {stats.todayActivations}
                        </div>
                        <p className="text-sm text-gray-600">Products activated today</p>
                      </div>
                    </div>
                  </div>

                  {/* Top Selling Products */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
                      <Award className="w-6 h-6 text-yellow-600" />
                    </div>
                    {stats.topProducts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.topProducts.map((product, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={product.imageUrl}
                                alt={product.productName}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 text-sm">{product.productName}</h4>
                                <p className="text-sm text-gray-600">{product.activationCount} activations</p>
                              </div>
                              <div className="text-2xl font-bold text-yellow-600">
                                #{index + 1}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No product activation data available</p>
                      </div>
                    )}
                  </div>

                  {/* Weekly Activation Chart */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activation Trend</h3>
                    {stats.weeklyActivations.length > 0 ? (
                      <div className="h-64 flex items-end justify-between space-x-2">
                        {stats.weeklyActivations.map((day, index) => {
                          const maxCount = Math.max(...stats.weeklyActivations.map(d => d.count));
                          const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center">
                              <div 
                                className="w-full bg-blue-500 rounded-t transition-all duration-500"
                                style={{ height: `${height}%` }}
                              />
                              <div className="text-xs text-gray-500 mt-2 text-center">
                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                              <div className="text-xs font-medium text-gray-900">
                                {day.count}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No weekly data available</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'shops' && (
            <ShopManagement token={token} onStatsUpdate={fetchStats} />
          )}

          {activeTab === 'products' && (
            <ProductManagement token={token} onStatsUpdate={fetchStats} />
          )}

          {activeTab === 'qrcodes' && (
            <QRCodeManagement token={token} onStatsUpdate={fetchStats} />
          )}

          {activeTab === 'settings' && (
            <Settings token={token} />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;