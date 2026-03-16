const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');
const Admin = require('../models/Admin');
const Report = require('../models/Report');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Generate JWT
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '8h' });

// POST /api/auth/login
router.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }
    const admin = await Admin.findOne({ username }).select('+passwordHash');
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = signToken(admin._id, admin.role);
    return res.json({
      success: true,
      token,
      admin: { id: admin._id, username: admin.username, role: admin.role, displayName: admin.displayName },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/admin/seed — Create initial admin (dev only, disable in production)
router.post('/seed', async (req, res) => {
  try {
    const existing = await Admin.findOne({ username: 'admin' });
    if (existing) {
      return res.json({ success: false, message: 'Admin already seeded' });
    }
    const passwordHash = await bcrypt.hash('admin123', 12);
    await Admin.create({ username: 'admin', passwordHash, role: 'superadmin', displayName: 'Super Admin' });
    return res.json({ success: true, message: 'Admin seeded: admin / admin123' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/reports - List all reports with filters
router.get('/reports', protect, async (req, res) => {
  try {
    const { status, category, urgency, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (urgency) filter.urgency = urgency;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reports, total] = await Promise.all([
      Report.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).select('-ipHash'),
      Report.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: reports,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/reports/export/pdf - Export reports as PDF
// NOTE: This MUST be before /reports/:id to avoid Express matching 'export' as an ID
router.get('/reports/export/pdf', protect, async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const reports = await Report.find(filter).sort('-createdAt').limit(100).select('-ipHash');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="crime-reports.pdf"');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#1e293b').text('Crime Report Portal', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1.5);

    // Summary line
    doc.fontSize(12).fillColor('#0f172a').text(`Total Reports: ${reports.length}`);
    doc.moveDown(1);

    // Reports
    reports.forEach((r, i) => {
      if (doc.y > 700) doc.addPage();
      doc.rect(doc.page.margins.left, doc.y, doc.page.width - doc.page.margins.left - doc.page.margins.right, 110)
        .fillAndStroke('#f8fafc', '#e2e8f0');

      const startY = doc.y + 8;
      doc.fillColor('#0f172a').fontSize(11).text(`#${i + 1} — ${r.category} [${r.urgency}]`, doc.page.margins.left + 10, startY);
      doc.fillColor('#475569').fontSize(9)
        .text(`ID: ${r.anonId}`, doc.page.margins.left + 10, startY + 16)
        .text(`Status: ${r.status}   Assigned: ${r.assignedTo || 'Unassigned'}`, doc.page.margins.left + 10, startY + 28)
        .text(`Location: ${r.location.address || `${r.location.coordinates[1].toFixed(4)}, ${r.location.coordinates[0].toFixed(4)}`}`, doc.page.margins.left + 10, startY + 40)
        .text(`Date: ${new Date(r.createdAt).toLocaleString()}`, doc.page.margins.left + 10, startY + 52)
        .text(`Description: ${r.description.substring(0, 150)}${r.description.length > 150 ? '...' : ''}`, doc.page.margins.left + 10, startY + 64, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 20 });

      doc.moveDown(0.5);
      doc.y = startY + 118;
    });

    doc.end();
  } catch (err) {
    console.error('PDF export error:', err);
    return res.status(500).json({ success: false, message: 'PDF generation failed' });
  }
});

// GET /api/admin/reports/:id - Get single report (admin)
router.get('/reports/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).select('-ipHash');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    return res.json({ success: true, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/reports/:id - Update status
router.put('/reports/:id', protect, async (req, res) => {
  try {
    const { status, note, assignedTo } = req.body;
    const validStatuses = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    if (status) {
      report.status = status;
      report.statusHistory.push({
        status,
        note: note || '',
        updatedBy: req.admin.username,
      });
    }
    if (assignedTo !== undefined) report.assignedTo = assignedTo;

    await report.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(report.anonId).emit('reportUpdate', {
        anonId: report.anonId,
        status: report.status,
        statusHistory: report.statusHistory,
        updatedAt: report.updatedAt,
      });
      io.to('admin-room').emit('reportUpdated', { id: report._id, status: report.status });
    }

    return res.json({ success: true, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/analytics - Crime analytics
router.get('/analytics', protect, async (req, res) => {
  try {
    const [byCategory, byStatus, byUrgency, monthlyCounts, hotspots] = await Promise.all([
      Report.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Report.aggregate([{ $group: { _id: '$urgency', count: { $sum: 1 } } }]),
      Report.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
      Report.aggregate([
        {
          $group: {
            _id: { lat: { $round: ['$location.coordinates.1', 3] }, lng: { $round: ['$location.coordinates.0', 3] } },
            count: { $sum: 1 },
            categories: { $addToSet: '$category' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
    ]);

    const totalReports = await Report.countDocuments();
    const resolved = await Report.countDocuments({ status: 'Resolved' });

    return res.json({
      success: true,
      data: {
        totalReports,
        resolved,
        resolutionRate: totalReports ? Math.round((resolved / totalReports) * 100) : 0,
        byCategory,
        byStatus,
        byUrgency,
        monthly: monthlyCounts.reverse(),
        hotspots: hotspots.map((h) => ({
          lat: h._id.lat,
          lng: h._id.lng,
          count: h.count,
          categories: h.categories,
        })),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;
