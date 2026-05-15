import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password, companyCode } = req.body;

  try {
    // جلب بيانات المستخدم مع كود الشركة المرتبط به
    const result = await db.query(
      `SELECT u.*, c.code as company_code 
       FROM users u 
       LEFT JOIN companies c ON u.company_id = c.id 
       WHERE u.username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'اسم المستخدم غير موجود' });
    }

    const user = result.rows[0];

    // التحقق من كلمة المرور (نص عادي)
    if (user.password !== password) {
      return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
    }

    // التحقق من كود الشركة:
    // 1. السوبر أدمن يدخل بدون كود شركة.
    // 2. المحاسب يجب أن يطابق كود شركته الكود المدخل في الواجهة.
    if (user.role === 'company_accountant') {
      if (!companyCode || user.company_code !== companyCode) {
        return res.status(401).json({ error: 'كود الشركة غير صحيح أو غير مدخل' });
      }
    }
    // داخل auth.js، بعد التحقق من companyCode وقبل إنشاء التوكن

// التحقق من صلاحية اشتراك الشركة (للمحاسبين فقط)
    if (user.role === 'company_accountant') {
    const companyResult = await db.query(
        `SELECT subscription_expiry, status FROM companies WHERE id = $1`,
        [user.company_id]
    );
    
    if (companyResult.rows.length === 0) {
        return res.status(401).json({ error: 'الشركة غير موجودة' });
    }
    
    const company = companyResult.rows[0];
    const expiryDate = new Date(company.subscription_expiry);
    const today = new Date();
    
    if (company.status === 'متوقفة') {
        return res.status(401).json({ error: 'حساب الشركة موقوف، يرجى التواصل مع المدير' });
    }
    
    if (expiryDate < today) {
        return res.status(401).json({ error: 'انتهت صلاحية اشتراك الشركة. يرجى تجديد الاشتراك لتسجيل الدخول' });
    }
}

    // إنشاء التوكن وتخزين الـ id والـ role والـ company_id بداخله
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        company_id: user.company_id 
      },
      process.env.JWT_SECRET || 'your_secret_key', // تأكد من وجود مفتاح سري في ملف .env
      { expiresIn: '8h' }
    );

    // إرسال البيانات للواجهة الأمامية
    res.json({ 
      token, 
      role: user.role, 
      company_id: user.company_id,
      username: user.username 
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'خطأ في السيرفر أثناء تسجيل الدخول' });
  }
});

export default router;
