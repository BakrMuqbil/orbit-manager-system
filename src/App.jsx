import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import Login from './pages/Login/login';
import Home from './pages/Home/home';
import Dashboard from "./pages/Dashboard/Dashboard"
import DriverManager from './components/DriverManager/DriverManager';
import BusManager from "./components/BusManager/BusManager";
import DriverLedger from "./components/DriverLedger/DriverLedger";
import BusLedger from "./components/BusLedger/BusLedger"
import CompaniesManager from "./components/CompaniesManager/CompaniesManager";
import UsersManager from "./components/UsersManager/UsersManager"

// مكون الحماية (ضعه فوق دالة App)
const ProtectedRoute = ({ children = null }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* صفحة تسجيل الدخول: بدون Sidebar طبعاً */}
        <Route path="/" element={<Login />} />
        
        {/* صفحات السجلات: عرض كامل الشاشة (بدون Sidebar) */}
        <Route 
          path="/ledger/:driverId" 
          element={<ProtectedRoute><DriverLedger /></ProtectedRoute>} 
        />
        <Route 
          path="/bus-ledger/:busId" 
          element={<ProtectedRoute><BusLedger /></ProtectedRoute>} 
        />

        {/* مسارات النظام الرئيسية: تحتوي على Sidebar (داخل مكون Home) */}
        <Route 
          path="/home" 
          element={<ProtectedRoute><Home /></ProtectedRoute>}
        >
          {/* هذه المكونات ستظهر بجانب الـ Sidebar بفضل Outlet */}
          <Route path="drivers" element={<DriverManager />} />
          <Route path="UsersManager" element={<UsersManager />} />
          <Route path="buses" element={<BusManager />} />
          <Route path="dashboard" element={<Dashboard />}/>
          <Route path="CompaniesManager" element={<CompaniesManager />}/>
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
