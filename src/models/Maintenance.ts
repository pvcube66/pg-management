import mongoose, { Schema } from "mongoose";

const MaintenanceSchema = new Schema({
  pgId: { type: Schema.Types.ObjectId, ref: 'PG', required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['plumbing', 'electrical', 'furniture', 'cleaning', 'appliance', 'structural', 'other'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  roomNumber: String,
  floorNumber: Number,
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedDate: Date,
  cost: { type: Number, default: 0 },
  notes: String,
  images: [String]
}, { timestamps: true });

MaintenanceSchema.index({ pgId: 1, status: 1 });
MaintenanceSchema.index({ priority: 1, status: 1 });

export const Maintenance = mongoose.models.Maintenance || mongoose.model("Maintenance", MaintenanceSchema);
