import mongoose, { Schema, Model } from "mongoose";

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: false }, // Optional for Google Auth
  role: { type: String, enum: ['superadmin', 'pgowner', 'incharge'], required: true },
  pgId: { type: Schema.Types.ObjectId, ref: 'PG' },
  ownedPgs: [{ type: Schema.Types.ObjectId, ref: 'PG' }]
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
