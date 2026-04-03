import React, { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar_1"; 
import "./home.css";

const Home = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // التعديل: التحقق من وجود التوكن لمنع الطرد التلقائي
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        }
    }, [navigate]);

    // نتحقق إذا كان المسار هو /home بالضبط
    const isRootHome = location.pathname === "/home" || location.pathname === "/home/";

    return (
        <div className="home-layout">
            <Sidebar />

            <main className="main-content">
                {isRootHome ? (
                    /* هذه الشاشة تظهر فقط عند الدخول لـ /home مباشرة (للسوبر أدمن مثلاً) */
                    <div className="dashboard-content">
                        <header className="welcome-section">
                          <h1>
                          welcome in Orbit System
                          </h1>
                            <p>يرجى اختيار أحد الخيارات من القائمة الجانبية للبدء.</p>
                        </header>
                    </div>
                ) : (
                    /* هنا تظهر المكونات الفرعية مثل Dashboard أو Buses عند الضغط عليها */
                    <Outlet />
                )}
            </main>
        </div>
    );
};

export default Home;
