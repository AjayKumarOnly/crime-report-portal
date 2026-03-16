const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  type: { type: String, enum: ['image', 'video'], default: 'image' },
});

const StatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Submitted', 'Assigned', 'In Progress', 'Resolved'],
    required: true,
  },
  note: { type: String, default: '' },
  updatedBy: { type: String, default: 'System' },
  updatedAt: { type: Date, default: Date.now },
});

const ReportSchema = new mongoose.Schema(
  {
    anonId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['Theft', 'Harassment', 'Traffic', 'Domestic Violence', 'Others'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    urgency: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low',
    },
    media: [MediaSchema],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['Submitted', 'Assigned', 'In Progress', 'Resolved'],
      default: 'Submitted',
      index: true,
    },
    statusHistory: [StatusHistorySchema],
    contactInfo: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    assignedTo: { type: String, default: '' },
    isAnonymous: { type: Boolean, default: true },
    ipHash: { type: String, select: false },
  },
  { timestamps: true }
);

// 2dsphere index for geo queries
ReportSchema.index({ location: '2dsphere' });
ReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', ReportSchema);
