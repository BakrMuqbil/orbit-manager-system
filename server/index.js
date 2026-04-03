import express from 'express';
import cors from 'cors';
import db from '../db.js';
import authRoutes from './auth.js';
import authMiddleware from './authMiddleware.js';

const app = express();
app.use(cors());
app.use(express.json());

// 1. مسارات الحماية وتسجيل الدخول
app.use('/api', authRoutes);

// ==========================================
// 1. مسارات الداشبورد (Dashboard Stats)
// ==========================================
app.get('/api/dashboard', authMiddleware, async (req, res) => {
  const { from, to } = req.query;
  const { company_id, role } = req.user;

  try {
    // بناء شروط الفلترة بناءً على الدور والشركة
    const isSuper = role === 'super_admin';
    const companyFilter = isSuper ? '' : 'WHERE company_id = $1';
    const params = isSuper ? [] : [company_id];

    const driversRes = await db.query(`SELECT * FROM drivers ${companyFilter}`, params);
    const ledgerRes = await db.query(`SELECT * FROM ledger ${companyFilter}`, params);
    const repairsRes = await db.query(`SELECT * FROM repairs ${companyFilter}`, params);
    const busesRes = await db.query(`SELECT * FROM buses ${companyFilter}`, params);

    const drivers = driversRes.rows;
    const ledger = ledgerRes.rows;
    const repairs = repairsRes.rows;

    const filteredLedger = ledger.filter(entry => 
      (!from || entry.date >= from) && (!to || entry.date <= to)
    );

    const todayRevenue = filteredLedger.reduce((acc, curr) => acc + Number(curr.paidAmount || 0), 0);
    const oilExpenses = ledger.filter(e => e.type === 'oil').reduce((acc, curr) => acc + Number(curr.paidAmount || 0), 0);
    const maintenanceExpenses = repairs.reduce((acc, curr) => acc + Number(curr.cost || 0), 0);
    const totalRevenue = ledger.reduce((acc, curr) => acc + Number(curr.paidAmount || 0), 0);

    // حساب مديونية النظام للشركة المحددة فقط
    const totalSystemDebt = drivers.reduce((acc, driver) => {
      const driverEntries = ledger.filter(l => String(l.driverId) === String(driver.id));
      const bus = busesRes.rows.find(b => b.id === driver.busId);
      const rentAmount = bus ? Number(bus.dailyRent || 0) : 0;
      
      const driverDebt = driverEntries.reduce((sum, entry) => sum + (rentAmount - Number(entry.paidAmount || 0)), 0);
      return acc + driverDebt;
    }, 0);

    res.json({
      totalRevenue,
      todayRevenue,
      oilExpenses,
      maintenanceExpenses,
      totalDrivers: drivers.length,
      totalSystemDebt,
    });
  } catch (err) {
    res.status(500).send('خطأ في جلب بيانات الداشبورد');
  }
});

// ==========================================
// إدارة الشركات ونظام الاشتراكات (Packages)
// ==========================================

// 1. جلب الشركات (GET)

// 1. جلب الشركات (GET)
app.get('/api/companies', authMiddleware, async (req, res) => {
  const { role, company_id } = req.user;
  try {
    let result;
    // السوبر أدمن يرى الكل، والشركة ترى بياناتها فقط
    if (role === 'super_admin') {
      result = await db.query('SELECT * FROM companies ORDER BY created_at DESC');
    } else {
      result = await db.query('SELECT * FROM companies WHERE id = $1', [company_id]);
    }
    res.json(result.rows);
  } catch (err) {
    console.error("GET Error:", err.message);
    res.status(500).send('خطأ في جلب بيانات الشركات');
  }
});

// 2. إضافة شركة جديدة (POST)
app.post('/api/companies', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).send("غير مصرح");

  const { name, code, owner_name, phone, address, package_type, status } = req.body;

  // حساب الباقة والمبلغ
  let months = 0;
  let amount = 0;
  switch (package_type) {
    case 'تجريبية': months = 1; amount = 0; break;
    case '3 أشهر': months = 3; amount = 30000; break;
    case '6 أشهر': months = 6; amount = 60000; break;
    case 'سنة': months = 12; amount = 100000; break;
    default: months = 1; amount = 0; // افتراضي شهر تجريبي
  }

  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + months);

  try {
    const result = await db.query(
      `INSERT INTO companies 
       (name, code, owner_name, phone, address, package_type, subscription_amount, subscription_date, subscription_expiry, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8, $9) RETURNING *`,
      [
        name, 
        code, 
        owner_name || '', 
        phone || '', 
        address || '', 
        package_type || 'تجريبية', 
        amount, 
        expiryDate, 
        status || 'نشط'
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST Database Error:", err.message);
    res.status(500).send(`فشل الإنشاء: كود الشركة مكرر أو بيانات ناقصة`);
  }
});

// 3. تحديث البيانات أو التجديد (PUT)
app.put('/api/companies/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).send("غير مصرح");

  const { id } = req.params;
  const { name, code, owner_name, phone, address, package_type, status, renew } = req.body;

  try {
    let result;
    
    // إذا كان هناك طلب "تجديد" أو "تغيير نوع الباقة"
    if (renew || package_type) {
      // حساب القيم الجديدة بناءً على الباقة المختارة
      let months = (package_type === 'سنة') ? 12 : (package_type === '6 أشهر') ? 6 : (package_type === '3 أشهر') ? 3 : 1;
      let amount = (package_type === 'سنة') ? 100000 : (package_type === '6 أشهر') ? 60000 : (package_type === '3 أشهر') ? 30000 : 0;
      
      const newExpiry = new Date();
      newExpiry.setMonth(newExpiry.getMonth() + months);

      // التحديث الشامل: يشمل البيانات الأساسية + الباقة والمبلغ والتاريخ
      result = await db.query(
        `UPDATE companies 
         SET name=$1, code=$2, owner_name=$3, phone=$4, address=$5, status=$6, 
             package_type=$7, subscription_amount=$8, subscription_expiry=$9 
         WHERE id=$10 RETURNING *`,
        [name, code, owner_name, phone, address, status || 'نشط', package_type, amount, newExpiry, id]
      );
    } else {
      // تحديث البيانات العادية فقط (في حال لم يتم تغيير الباقة)
      result = await db.query(
        `UPDATE companies SET name=$1, code=$2, owner_name=$3, phone=$4, address=$5, status=$6 WHERE id=$7 RETURNING *`,
        [name, code, owner_name, phone, address, status || 'نشط', id]
      );
    }
    
    if (result.rowCount === 0) return res.status(404).send("الشركة غير موجودة");
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT Error:", err.message);
    res.status(500).send("خطأ أثناء تحديث بيانات الشركة");
  }
});


// 4. حذف الشركة (DELETE)
app.delete('/api/companies/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).send("غير مصرح");
  try {
    const result = await db.query('DELETE FROM companies WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).send("الشركة غير موجودة");
    res.json({ success: true, message: "تم حذف الشركة بنجاح" });
  } catch (err) {
    console.error("DELETE Error:", err.message);
    res.status(500).send("لا يمكن حذف الشركة لوجود بيانات مرتبطة بها");
  }
});


// ==========================================
// --- قسم إدارة المستخدمين(users)
// ==========================================


// 1. جلب قائمة المستخدمين مع اسم الشركة
app.get('/api/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).send("غير مصرح لك");

  try {
    const result = await db.query(`
      SELECT u.id, u.username, u.password, u.role, u.company_id, c.name as company_name 
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      ORDER BY u.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("خطأ في جلب بيانات المستخدمين");
  }
});

// 2. إنشاء مستخدم جديد (POST)
app.post('/api/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).send("غير مصرح لك");

  const { username, password, role, company_id } = req.body;

  try {
    // تحديد الشركة: نل للسوبر أدمن، وقيمة الشركة للمحاسب
    const finalCompanyId = role === 'super_admin' ? null : company_id;

    const result = await db.query(
      `INSERT INTO users (username, password, role, company_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [username, password, role, finalCompanyId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("خطأ في إنشاء المستخدم، قد يكون الاسم مكرراً");
  }
});

// 3. تحديث بيانات مستخدم (PUT)
app.put('/api/users/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).send("غير مصرح لك");

  const { id } = req.params;
  const { username, password, role, company_id } = req.body;

  try {
    const finalCompanyId = role === 'super_admin' ? null : company_id;

    const result = await db.query(
      `UPDATE users 
       SET username=$1, password=$2, role=$3, company_id=$4 
       WHERE id=$5 RETURNING *`,
      [username, password, role, finalCompanyId, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("خطأ في تحديث بيانات المستخدم");
  }
});

// 4. حذف مستخدم (DELETE)
app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).send("غير مصرح لك");
  
  try {
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: "تم حذف المستخدم بنجاح" });
  } catch (err) {
    res.status(500).send("خطأ في عملية الحذف");
  }
});



// ==========================================
// 2. مسارات المركبات (Buses)
// ==========================================
app.get('/api/buses', authMiddleware, async (req, res) => {
  const { company_id, role } = req.user;
  try {
    let query = `
      SELECT b.*, CASE WHEN d.id IS NOT NULL THEN 'خارج الخدمة' ELSE 'في الخدمة' END AS status
      FROM buses b
      LEFT JOIN drivers d ON b.id = d."busId"`;
    
    const result = (role === 'super_admin') 
      ? await db.query(query + ' ORDER BY b.id DESC')
      : await db.query(query + ' WHERE b.company_id = $1 ORDER BY b.id DESC', [company_id]);
      
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('خطأ في جلب الباصات');
  }
});

app.post('/api/buses', authMiddleware, async (req, res) => {
  const { busNumber, initialMeter, dailyRent } = req.body;
  const { company_id } = req.user;
  try {
    const result = await db.query(
      'INSERT INTO buses ("busNumber", "initialMeter", "dailyRent", company_id) VALUES ($1,$2,$3,$4) RETURNING *',
      [busNumber, initialMeter, dailyRent, company_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('خطأ في إضافة الباص');
  }
});

app.put('/api/buses/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { busNumber, initialMeter, dailyRent } = req.body;
  const { company_id, role } = req.user;
  try {
    const filter = role === 'super_admin' ? '' : 'AND company_id = $5';
    const params = role === 'super_admin' ? [busNumber, initialMeter, dailyRent, id] : [busNumber, initialMeter, dailyRent, id, company_id];
    
    const result = await db.query(`UPDATE buses SET "busNumber"=$1, "initialMeter"=$2, "dailyRent"=$3 WHERE id=$4 ${filter} RETURNING *`, params);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('خطأ في تعديل الباص');
  }
});

app.delete('/api/buses/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { company_id, role } = req.user;
  try {
    role === 'super_admin' 
      ? await db.query('DELETE FROM buses WHERE id=$1', [id])
      : await db.query('DELETE FROM buses WHERE id=$1 AND company_id=$2', [id, company_id]);
    res.send('تم حذف الباص بنجاح');
  } catch (err) {
    res.status(500).send('خطأ في حذف الباص');
  }
});

// ==========================================
// 3. مسارات السائقين (Drivers)
// ==========================================
app.get('/api/driversData', authMiddleware, async (req, res) => {
  const { company_id, role } = req.user;
  try {
    let query = `
      SELECT d.*, b."busNumber", b."dailyRent", b."initialMeter",
      COALESCE((SELECT l."currentMeter" FROM ledger l WHERE l."driverId" = d.id ORDER BY l.date DESC LIMIT 1), b."initialMeter") AS lastMeter
      FROM drivers d
      LEFT JOIN buses b ON d."busId" = b.id`;
    
    const result = (role === 'super_admin')
      ? await db.query(query + ' ORDER BY d.id DESC')
      : await db.query(query + ' WHERE d.company_id = $1 ORDER BY d.id DESC', [company_id]);
      
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('خطأ في جلب السائقين');
  }
});

app.post('/api/driversData', authMiddleware, async (req, res) => {
  const { name, phone, guarantor, receiveDate, busId } = req.body;
  const { company_id } = req.user;
  try {
    const result = await db.query(
      'INSERT INTO drivers (name, phone, guarantor, "receiveDate", "busId", company_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, phone, guarantor, receiveDate, busId, company_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('خطأ في إضافة السائق');
  }
});

// تعديل بيانات سائق
app.put('/api/driversData/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, phone, guarantor, receiveDate, busId } = req.body;
  const { company_id, role } = req.user;

  try {
    // السوبر أدمن يمكنه التعديل مطلقاً، المحاسب يعدل سائقي شركته فقط
    const query = (role === 'super_admin')
      ? 'UPDATE drivers SET name=$1, phone=$2, guarantor=$3, "receiveDate"=$4, "busId"=$5 WHERE id=$6 RETURNING *'
      : 'UPDATE drivers SET name=$1, phone=$2, guarantor=$3, "receiveDate"=$4, "busId"=$5 WHERE id=$6 AND company_id=$7 RETURNING *';

    const params = (role === 'super_admin')
      ? [name, phone, guarantor, receiveDate, busId, id]
      : [name, phone, guarantor, receiveDate, busId, id, company_id];

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).send('السائق غير موجود أو لا تملك صلاحية تعديله');
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('خطأ في تعديل السائق');
  }
});

// حذف سائق
app.delete('/api/driversData/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { company_id, role } = req.user;

  try {
    const query = (role === 'super_admin')
      ? 'DELETE FROM drivers WHERE id=$1'
      : 'DELETE FROM drivers WHERE id=$1 AND company_id=$2';

    const params = (role === 'super_admin') ? [id] : [id, company_id];
    const result = await db.query(query, params);

    res.send('تم حذف السائق بنجاح');
  } catch (err) {
    res.status(500).send('خطأ في حذف السائق');
  }
});


// ==========================================
// 4. مسارات السجل المالي (Ledger)
// ==========================================
app.get('/api/ledger', authMiddleware, async (req, res) => {
  const { driverId } = req.query;
  const { company_id, role } = req.user;
  try {
    let query = 'SELECT * FROM ledger';
    let params = [];

    if (role !== 'super_admin') {
      query += ' WHERE company_id = $1';
      params.push(company_id);
      if (driverId) { query += ' AND "driverId" = $2'; params.push(driverId); }
    } else if (driverId) {
      query += ' WHERE "driverId" = $1';
      params.push(driverId);
    }

    const result = await db.query(query + ' ORDER BY date DESC', params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('خطأ في جلب السجل');
  }
});

app.post('/api/ledger', authMiddleware, async (req, res) => {
  const { driverId, busId, date, currentMeter, paidAmount, type, note } = req.body;
  const { company_id } = req.user;
  try {
    const result = await db.query(
      'INSERT INTO ledger ("driverId", "busId", date, "currentMeter", "paidAmount", type, note, company_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [driverId, busId, date, currentMeter, paidAmount, type, note, company_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('خطأ في إضافة السجل');
  }
});

// تعديل سجل مالي
app.put('/api/ledger/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { driverId, busId, date, currentMeter, paidAmount, type, note } = req.body;
  const { company_id, role } = req.user;

  try {
    const query = (role === 'super_admin')
      ? 'UPDATE ledger SET "driverId"=$1, "busId"=$2, date=$3, "currentMeter"=$4, "paidAmount"=$5, type=$6, note=$7 WHERE id=$8 RETURNING *'
      : 'UPDATE ledger SET "driverId"=$1, "busId"=$2, date=$3, "currentMeter"=$4, "paidAmount"=$5, type=$6, note=$7 WHERE id=$8 AND company_id=$9 RETURNING *';

    const params = (role === 'super_admin')
      ? [driverId, busId, date, currentMeter, paidAmount, type, note, id]
      : [driverId, busId, date, currentMeter, paidAmount, type, note, id, company_id];

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).send('السجل غير موجود أو لا تملك صلاحية تعديله');
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('خطأ في تعديل السجل');
  }
});

// حذف سجل مالي
app.delete('/api/ledger/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { company_id, role } = req.user;

  try {
    const query = (role === 'super_admin')
      ? 'DELETE FROM ledger WHERE id=$1'
      : 'DELETE FROM ledger WHERE id=$1 AND company_id=$2';

    const params = (role === 'super_admin') ? [id] : [id, company_id];
    await db.query(query, params);

    res.send('تم الحذف بنجاح');
  } catch (err) {
    res.status(500).send('خطأ في الحذف');
  }
});

// =======================
// 🛠️ مسارات الإصلاحات (repairs)
// =======================
app.get('/api/repairsData', authMiddleware, async (req, res) => {
  const { busId } = req.query;
  const { company_id, role } = req.user;
  try {
    let query = 'SELECT * FROM repairs';
    let params = [];
    
    if (role !== 'super_admin') {
      query += ' WHERE company_id = $1';
      params.push(company_id);
      if (busId) { query += ' AND "busId" = $2'; params.push(busId); }
    } else if (busId) {
      query += ' WHERE "busId" = $1';
      params.push(busId);
    }

    const result = await db.query(query + ' ORDER BY date DESC', params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('خطأ في جلب الإصلاحات');
  }
});

app.post('/api/repairsData', authMiddleware, async (req, res) => {
  const { busId, date, note, cost } = req.body;
  const { company_id } = req.user;
  try {
    const result = await db.query(
      'INSERT INTO repairs ("busId", date, note, cost, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [busId, date || new Date(), note, cost, company_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('خطأ في إضافة الإصلاح');
  }
});

// ==========================================
// 🛢️ مسار الزيت (Oil Changes)
// ==========================================
app.get('/api/oil_changes', authMiddleware, async (req, res) => {
  const { busId } = req.query;
  const { company_id, role } = req.user;
  try {
    let query = 'SELECT * FROM oil_changes';
    let params = [];
    if (role !== 'super_admin') {
      query += ' WHERE company_id = $1';
      params.push(company_id);
      if (busId) { query += ' AND busid = $2'; params.push(busId); }
    } else if (busId) {
      query += ' WHERE busid = $1';
      params.push(busId);
    }
    const result = await db.query(query + ' ORDER BY changedate DESC', params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('خطأ في جلب بيانات الزيت');
  }
});

app.post('/api/oil_changes', authMiddleware, async (req, res) => {
  const { busId, date, currentMeter, paidAmount, note } = req.body;
  const { company_id } = req.user;
  try {
    const oilResult = await db.query(
      'INSERT INTO oil_changes (busid, changedate, totaldistance, amount, note, company_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [busId, date || new Date(), currentMeter, paidAmount, note, company_id]
    );
    await db.query('UPDATE buses SET "initialMeter" = $1 WHERE id = $2', [currentMeter, busId]);
    res.json({ success: true, data: oilResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'فشل في تسجيل تغيير الزيت' });
  }
});

// تشغيل السيرفر للإنتاج والتطوير
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Server on port: ${PORT}`));
}

export default app;
