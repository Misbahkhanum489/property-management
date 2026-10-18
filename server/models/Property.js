
import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: [true, "Company ID is required"],
      trim: true,
      validate: {
        validator: (value) => value.length > 0,
        message: "Company ID cannot be empty",
      },
    },

    propertyName: {
      type: String,
      required: [true, "Property name is required"],
      trim: true,
    },

    buildingNumber: {
      type: String,
      trim: true,
      default: "",
    },

    unitNumber: {
      type: String,
      required: [true, "Unit number is required"],
      trim: true,
      validate: {
        validator: (value) => value.length > 0,
        message: "Unit number cannot be blank",
      },
    },

    tenantName: {
      type: String,
      trim: true,
      default: "",
    },

    tenantContact: {
      type: String,
      trim: true,
      default: "",
    },

    annualRent: {
      type: Number,
      required: [true, "Annual rent is required"],
      min: [0, "Annual rent cannot be negative"],
      validate: {
        validator: (value) => Number.isFinite(value),
        message: "Annual rent must be a valid number",
      },
    },

    status: {
      type: String,
      enum: {
        values: ["Vacant", "Occupied", "Maintenance"],
        message: "Status must be Vacant, Occupied, or Maintenance",
      },
      default: "Vacant",
    },
  },
  { timestamps: true }
);

// Unit numbers must be unique within each company.
propertySchema.index(
  { companyId: 1, unitNumber: 1 },
  { unique: true }
);

const Property = mongoose.model("Property", propertySchema);

export default Property;
