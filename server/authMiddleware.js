import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  // جلب التوكن من الهيدر (Authorization: Bearer <token>)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'يجب تسجيل الدخول أولاً (No Token)' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'جلسة الدخول انتهت، يرجى تسجيل الدخول مجدداً' });
    }

    // تخزين بيانات المستخدم المشفرة في الكائن req لاستخدامها في الدوال اللاحقة
    // الآن req.user يحتوي على id, role, company_id
    req.user = decoded;
    
    next(); // الانتقال إلى الدالة التالية (مثل جلب الباصات)
  });
};

export default authMiddleware;
