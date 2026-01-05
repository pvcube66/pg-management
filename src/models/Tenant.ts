import mongoose, { Schema } from "mongoose";

const TenantSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  idProof: {
    type: { type: String, enum: ['aadhar', 'passport', 'driving_license', 'other'] },
    number: String,
    documentUrl: String
  },
  pgId: { type: Schema.Types.ObjectId, ref: 'PG', required: true },
  roomId: { type: Schema.Types.ObjectId },
  floorNumber: { type: Number },
  roomNumber: { type: String },
  bedNumber: { type: Number },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date },
  monthlyRent: { type: Number, required: true },
  securityDeposit: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'pending', 'left'], default: 'pending' },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  notes: String
}, { timestamps: true });

TenantSchema.index({ pgId: 1, status: 1 });
TenantSchema.index({ email: 1 });

export const Tenant = mongoose.models.Tenant || mongoose.model("Tenant", TenantSchema);
