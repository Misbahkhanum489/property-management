
import express from "express";
import mongoose from "mongoose";
import Property from "../models/Property.js";

const router = express.Router();

const COMPANY_UNIT_LIMITS = {
  company001: 12,
};

// Convert old Maintenance records to Occupied.
let migrationPromise = null;

async function migrateMaintenanceRecords() {
  if (!migrationPromise) {
    migrationPromise = Property.updateMany(
      { status: "Maintenance" },
      { $set: { status: "Occupied" } }
    ).catch((error) => {
      migrationPromise = null;
      throw error;
    });
  }

  return migrationPromise;
}

function isValidStatus(status) {
  return status === "Occupied" || status === "Vacant";
}

// ADD a new unit.
// POST /api/properties
router.post("/", async (req, res) => {
  try {
    const {
      companyId,
      propertyName,
      buildingNumber,
      unitNumber,
      tenantName,
      tenantContact,
      annualRent,
      status,
    } = req.body;

    if (
      typeof companyId !== "string" ||
      !companyId.trim() ||
      typeof unitNumber !== "string" ||
      !unitNumber.trim()
    ) {
      return res.status(400).json({
        message: "Company ID and unit number are required.",
      });
    }

    const normalizedCompanyId = companyId.trim();
    const normalizedUnitNumber = unitNumber.trim();

    if (status !== undefined && !isValidStatus(status)) {
      return res.status(400).json({
        message: "Status must be Occupied or Vacant.",
      });
    }

    await migrateMaintenanceRecords();

    // Enforce the company's unit limit on the server.
    const unitLimit = COMPANY_UNIT_LIMITS[normalizedCompanyId];

    if (unitLimit !== undefined) {
      const existingUnits = await Property.countDocuments({
        companyId: normalizedCompanyId,
      });

      if (existingUnits >= unitLimit) {
        return res.status(403).json({
          message: `Unit limit reached. This company can register a maximum of ${unitLimit} units.`,
          unitLimit,
          currentUnits: existingUnits,
        });
      }
    }

    const property = await Property.create({
      companyId: normalizedCompanyId,
      propertyName,
      buildingNumber,
      unitNumber: normalizedUnitNumber,
      tenantName: tenantName || "",
      tenantContact: tenantContact || "",
      annualRent,
      status: status || "Vacant",
    });

    return res.status(201).json({
      message: "Unit added successfully.",
      property,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This unit number already exists for this company.",
      });
    }

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Error adding unit:", error);

    return res.status(500).json({
      message: "Server error while adding the unit.",
    });
  }
});

// GET units for one company.
// GET /api/properties?companyId=company001
router.get("/", async (req, res) => {
  try {
    const { companyId } = req.query;

    if (typeof companyId !== "string" || !companyId.trim()) {
      return res.status(400).json({
        message: "Company ID is required.",
      });
    }

    await migrateMaintenanceRecords();

    const normalizedCompanyId = companyId.trim();

    const properties = await Property.find({
      companyId: normalizedCompanyId,
    }).sort({ createdAt: 1, _id: 1 });

    const unitLimit = COMPANY_UNIT_LIMITS[normalizedCompanyId];

    return res.status(200).json({
      count: properties.length,
      unitLimit: unitLimit ?? null,
      remainingUnits:
        unitLimit === undefined
          ? null
          : Math.max(0, unitLimit - properties.length),
      properties,
    });
  } catch (error) {
    console.error("Error fetching units:", error);

    return res.status(500).json({
      message: "Server error while fetching units.",
    });
  }
});

// EDIT an existing unit.
// PUT /api/properties/:id
// Include companyId in the request body.
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      companyId,
      propertyName,
      buildingNumber,
      unitNumber,
      tenantName,
      tenantContact,
      annualRent,
      status,
    } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid property ID.",
      });
    }

    if (
      typeof companyId !== "string" ||
      !companyId.trim()
    ) {
      return res.status(400).json({
        message: "Company ID is required.",
      });
    }

    if (status !== undefined && !isValidStatus(status)) {
      return res.status(400).json({
        message: "Status must be Occupied or Vacant.",
      });
    }

    if (
      unitNumber !== undefined &&
      (typeof unitNumber !== "string" || !unitNumber.trim())
    ) {
      return res.status(400).json({
        message: "Unit number cannot be empty.",
      });
    }

    await migrateMaintenanceRecords();

    const updates = {};

    if (propertyName !== undefined) updates.propertyName = propertyName;
    if (buildingNumber !== undefined) updates.buildingNumber = buildingNumber;
    if (unitNumber !== undefined) updates.unitNumber = unitNumber.trim();
    if (tenantName !== undefined) updates.tenantName = tenantName;
    if (tenantContact !== undefined) updates.tenantContact = tenantContact;
    if (annualRent !== undefined) updates.annualRent = annualRent;
    if (status !== undefined) updates.status = status;

    const property = await Property.findOneAndUpdate(
      {
        _id: id,
        companyId: companyId.trim(),
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!property) {
      return res.status(404).json({
        message: "Unit not found for this company.",
      });
    }

    return res.status(200).json({
      message: "Unit updated successfully.",
      property,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This unit number already exists for this company.",
      });
    }

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Error updating unit:", error);

    return res.status(500).json({
      message: "Server error while updating the unit.",
    });
  }
});

export default router;
