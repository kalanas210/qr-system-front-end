import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ShopLogin from './components/ShopLogin';
import QRScanner from './components/QRScanner';
import ActivationForm from './components/ActivationForm';
import WarrantyInfo from './components/WarrantyInfo';
import Footer from './components/Footer';

function App() {
  const [adminToken, setAdminToken] = useState<string | null>(
    localStorage.getItem('adminToken')
  );

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('adminToken', adminToken);
    } else {
      localStorage.removeItem('adminToken');
    }
  }, [adminToken]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route 
              path="/admin" 
              element={
                adminToken ? (
                  <AdminDashboard 
                    token={adminToken} 
                    onLogout={() => setAdminToken(null)} 
                  />
                ) : (
                  <AdminLogin onLogin={setAdminToken} />
                )
              } 
            />
            <Route path="/qr/:serialNumber" element={<QRScanner />} />
            <Route path="/shop/login/:serialNumber" element={<ShopLogin />} />
            <Route path="/activate/:serialNumber" element={<ActivationForm />} />
            <Route path="/warranty/:serialNumber" element={<WarrantyInfo />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;