import mongoose, { Schema } from "mongoose";

const BookingSchema = new Schema({
  roomId: { type: Schema.Types.ObjectId, required: true }, // We might need to store PG ID too for easier querying
  pgId: { type: Schema.Types.ObjectId, ref: 'PG', required: true }, // Added for easier filtering
  tenant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'paid', 'active', 'ended'], default: 'pending' }
}, { timestamps: true });

export const Booking = mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
