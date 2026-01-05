import mongoose, { Schema } from "mongoose";

const RoomSchema = new Schema({
  number: { type: String, required: true },
  bedCount: { type: Number, required: true },
  bedType: { type: String, enum: ['single', 'double', 'triple'], required: true },
  monthlyCost: { type: Number, required: true },
  occupiedBeds: { type: Number, default: 0 },
  occupants: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

const FloorSchema = new Schema({
  number: { type: Number, required: true },
  rooms: [RoomSchema]
});

const PGSchema = new Schema({
  name: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  floors: [FloorSchema],
  amenities: [String],
  totalCapacity: { type: Number, default: 0 }
}, { timestamps: true });

export const PG = mongoose.models.PG || mongoose.model("PG", PGSchema);
