// middleware/subscriptionMiddleware.js
import db from '../db.js';

export const checkCompanySubscription = async (req, res, next) => {
  // لا يتم التحقق إذا كان المستخدم سوبر أدمن
  if (req.user.role === 'super_admin') {
    return next();
  }

  const companyId = req.user.company_id;
  if (!companyId) {
    return res.status(403).json({ error: 'لا توجد شركة مرتبطة بهذا الحساب' });
  }

  try {
    const result = await db.query(
      `SELECT subscription_expiry, status FROM companies WHERE id = $1`,
      [companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الشركة غير موجودة' });
    }

    const company = result.rows[0];
    const expiryDate = new Date(company.subscription_expiry);
    const today = new Date();

    // إذا كانت الشركة موقوفة يدوياً أو اشتراكها منتهي
    if (company.status === 'متوقفة') {
      return res.status(403).json({ error: 'حساب الشركة موقوف مؤقتاً، يرجى التواصل مع الدعم' });
    }

    if (expiryDate < today) {
      return res.status(403).json({ error: 'انتهت صلاحية اشتراك الشركة، يرجى التجديد للمتابعة' });
    }

    next();
  } catch (err) {
    console.error('Subscription check error:', err);
    res.status(500).json({ error: 'خطأ في التحقق من صلاحية الاشتراك' });
  }
};