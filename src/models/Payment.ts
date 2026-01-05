import mongoose, { Schema } from "mongoose";

const PaymentSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  pgId: { type: Schema.Types.ObjectId, ref: 'PG', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['rent', 'deposit', 'maintenance', 'electricity', 'water', 'other'], default: 'rent' },
  month: { type: String, required: true }, // Format: "YYYY-MM"
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  status: { type: String, enum: ['pending', 'paid', 'overdue', 'partial'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'bank_transfer', 'card', 'other'] },
  transactionId: String,
  notes: String,
  lateFee: { type: Number, default: 0 }
}, { timestamps: true });

PaymentSchema.index({ tenantId: 1, month: 1 });
PaymentSchema.index({ pgId: 1, status: 1 });
PaymentSchema.index({ dueDate: 1 });

export const Payment = mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
