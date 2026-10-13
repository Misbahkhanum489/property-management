
import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      trim: true,
    },
    propertyName: {
      type: String,
      required: true,
      trim: true,
    },
    buildingNumber: {
      type: String,
      trim: true,
    },
    unitNumber: {
      type: String,
      required: true,
      trim: true,
    },
    annualRent: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Vacant", "Occupied", "Maintenance"],
      default: "Vacant",
    },
  },
  { timestamps: true }
);

propertySchema.index(
  { companyId: 1, unitNumber: 1 },
  { unique: true }
);

const Property = mongoose.model("Property", propertySchema);

export default Property;
