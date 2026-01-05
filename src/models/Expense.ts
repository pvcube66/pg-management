import mongoose, { Schema } from "mongoose";

const ExpenseSchema = new Schema({
  pgId: { type: Schema.Types.ObjectId, ref: 'PG', required: true },
  category: { type: String, enum: ['maintenance', 'utilities', 'salary', 'supplies', 'repair', 'renovation', 'other'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  paymentMethod: { type: String, enum: ['cash', 'bank_transfer', 'card', 'other'] },
  billNumber: String,
  vendorName: String,
  receiptUrl: String,
  addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  notes: String
}, { timestamps: true });

ExpenseSchema.index({ pgId: 1, date: -1 });
ExpenseSchema.index({ category: 1 });

export const Expense = mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
