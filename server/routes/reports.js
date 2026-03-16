const express = require('express');
const router = express.Router();
const Joi = require('joi');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Report = require('../models/Report');
const upload = require('../middleware/upload');
const { reportSubmitLimiter } = require('../middleware/rateLimiter');
const { hasCloudinary } = require('../middleware/upload');

// Validation schema
const reportSchema = Joi.object({
  category: Joi.string()
    .valid('Theft', 'Harassment', 'Traffic', 'Domestic Violence', 'Others')
    .required(),
  description: Joi.string().max(500).required(),
  urgency: Joi.string().valid('Low', 'Medium', 'High').default('Low'),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  address: Joi.string().max(300).allow('', null),
  contactPhone: Joi.string().max(15).allow('', null),
  contactEmail: Joi.string().email().allow('', null),
  isAnonymous: Joi.boolean().default(true),
});

// Helper: hash IP for spam detection (never stored in plaintext)
const hashIP = (ip) => crypto.createHash('sha256').update(ip + process.env.JWT_SECRET).digest('hex');

// POST /api/reports - Submit a new report
router.post('/', reportSubmitLimiter, upload.array('media', 5), async (req, res) => {
  try {
    const { error, value } = reportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const {
      category, description, urgency,
      latitude, longitude, address,
      contactPhone, contactEmail, isAnonymous,
    } = value;

    // Process uploaded files
    const backendUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
    const mediaFiles = (req.files || []).map((file) => {
      if (hasCloudinary) {
        return {
          url: file.path,
          publicId: file.filename,
          type: file.mimetype.startsWith('video/') ? 'video' : 'image',
        };
      } else {
        return {
          url: `${backendUrl}/uploads/${file.filename}`,
          publicId: file.filename,
          type: file.mimetype.startsWith('video/') ? 'video' : 'image',
        };
      }
    });


    const anonId = uuidv4();
    const ipHash = hashIP(req.ip || 'unknown');

    const report = await Report.create({
      anonId,
      category,
      description,
      urgency,
      media: mediaFiles,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address: address || '',
      },
      contactInfo: {
        phone: isAnonymous === 'true' || isAnonymous === true ? '' : (contactPhone || ''),
        email: isAnonymous === 'true' || isAnonymous === true ? '' : (contactEmail || ''),
      },
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      ipHash,
      statusHistory: [{ status: 'Submitted', note: 'Report received', updatedBy: 'System' }],
    });

    // Emit socket event for real-time admin dashboard update
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('newReport', {
        id: report._id,
        anonId: report.anonId,
        category: report.category,
        urgency: report.urgency,
        status: report.status,
        location: report.location,
        createdAt: report.createdAt,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        anonId: report.anonId,
        status: report.status,
        createdAt: report.createdAt,
      },
    });
  } catch (err) {
    console.error('Submit report error:', err);
    return res.status(500).json({ success: false, message: 'Server error submitting report' });
  }
});

// GET /api/reports/status/:anonId - Get report status by anonymousId
router.get('/status/:anonId', async (req, res) => {
  try {
    const report = await Report.findOne({ anonId: req.params.anonId })
      .select('-ipHash -contactInfo');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found. Check your tracking ID.' });
    }

    return res.json({
      success: true,
      data: {
        anonId: report.anonId,
        category: report.category,
        urgency: report.urgency,
        status: report.status,
        statusHistory: report.statusHistory,
        location: report.location,
        media: report.media,
        description: report.description,
        assignedTo: report.assignedTo,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      },
    });
  } catch (err) {
    console.error('Get status error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching status' });
  }
});

module.exports = router;
