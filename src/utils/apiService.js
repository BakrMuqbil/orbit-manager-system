// src/services/apiService.js

// المسار النسبي ليعمل مع الـ Proxy الموجود في vite.config.js
const API_URL = '/api'; 

/**
 * المحرك الأساسي (Core Request Handler)
 * تم تحديثه ليدعم إرسال التوكن تلقائياً ومعالجة انتهاء الجلسة، والتعامل الصحيح مع الأخطاء
 */
export const apiRequest = async (endpoint, method = 'GET', data = null) => {
    try {
        const token = localStorage.getItem('token');

        const options = {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_URL}/${endpoint}`, options);
        
        // ❌ إصلاح 1 و 3: رمي الخطأ بدلاً من التوجيه التلقائي في حال كان الطلب قادم من صفحة تسجيل الدخول نفسها
        if (response.status === 401) {
            const isLoginEndpoint = endpoint === 'login' || endpoint === 'auth/login';
            if (!isLoginEndpoint) {
                localStorage.clear(); 
                window.location.href = '/'; // توجيه للمسار الرئيسي للمنصة
                return;
            }
        }

        // معالجة الأخطاء إذا لم تكن الاستجابة ناجحة
        if (!response.ok) {
            let errorMessage = `Server Error: ${response.status}`;
            try {
                const errorData = await response.json();
                // ✅ إصلاح 2: قراءة .error أولاً ثم .message لضمان دقة رسالة الخطأ القادمة من السيرفر
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {}
            throw new Error(errorMessage);
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        
        return { success: true };
    } catch (error) {
        console.error(`API Error [${method}] on ${endpoint}:`, error);
        throw error;
    }
};

/**
 * دالة الجلب الذكية (smartGet)
 */
export const smartGet = async (endpoint, params = "") => {
    const query = params ? `?${params}` : "";
    return await apiRequest(`${endpoint}${query}`, 'GET');
};

/**
 * دالة الحفظ الشاملة (smartSave)
 */
export const smartSave = async (endpoint, data, id = null) => {
    const method = id ? 'PUT' : 'POST';
    const path = id ? `${endpoint}/${id}` : endpoint;
    return await apiRequest(path, method, data);
};

/**
 * دالة الحذف (smartDelete)
 */
export const smartDelete = async (endpoint, id) => {
    if (!id) throw new Error("ID مطلوب لعملية الحذف");
    return await apiRequest(`${endpoint}/${id}`, 'DELETE');
};

/**
 * دالة مخصصة لعمليات السجل (Ledger Operations)
 */
export const smartLedgerSave = async (data, id = null) => {
    return await smartSave('ledger', data, id);
};
