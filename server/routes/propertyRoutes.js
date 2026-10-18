
import express from "express";
import mongoose from "mongoose";
import Property from "../models/Property.js";

const router = express.Router();

const COMPANY_UNIT_LIMITS = {
  company001: 12,
  company002: 10,
  company003: 12,
};

// Convert legacy Maintenance records to Occupied.
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

function validateUnitInput(body, isUpdate = false) {
  const errors = [];

  if (
    !isUpdate &&
    (typeof body.companyId !== "string" || !body.companyId.trim())
  ) {
    errors.push("Company ID is required.");
  }

  if (
    !isUpdate &&
    (typeof body.propertyName !== "string" || !body.propertyName.trim())
  ) {
    errors.push("Property name is required.");
  }

  if (
    body.unitNumber !== undefined &&
    (typeof body.unitNumber !== "string" || !body.unitNumber.trim())
  ) {
    errors.push("Unit number cannot be empty.");
  }

  if (
    !isUpdate &&
    (body.unitNumber === undefined ||
      typeof body.unitNumber !== "string" ||
      !body.unitNumber.trim())
  ) {
    if (!errors.includes("Unit number cannot be empty.")) {
      errors.push("Unit number is required.");
    }
  }

  if (
    body.annualRent !== undefined &&
    (body.annualRent === "" ||
      body.annualRent === null ||
      !Number.isFinite(Number(body.annualRent)) ||
      Number(body.annualRent) < 0)
  ) {
    errors.push("Annual rent must be a valid non-negative number.");
  }

  if (
    !isUpdate &&
    (body.annualRent === undefined || body.annualRent === "")
  ) {
    errors.push("Annual rent is required.");
  }

  if (body.status !== undefined && !isValidStatus(body.status)) {
    errors.push("Status must be Occupied or Vacant.");
  }

  return errors;
}

// POST /api/properties — add a unit.
router.post("/", async (req, res) => {
  try {
    const errors = validateUnitInput(req.body);

    if (errors.length) {
      return res.status(400).json({
        message: errors[0],
        errors,
      });
    }

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

    const normalizedCompanyId = companyId.trim();
    const normalizedUnitNumber = unitNumber.trim();

    await migrateMaintenanceRecords();

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
      propertyName: propertyName.trim(),
      buildingNumber,
      unitNumber: normalizedUnitNumber,
      tenantName: tenantName ?? "",
      tenantContact: tenantContact ?? "",
      annualRent: Number(annualRent),
      status: status ?? "Vacant",
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
        message: "Please check the submitted unit details.",
        errors: Object.values(error.errors ?? {}).map(
          (item) => item.message
        ),
      });
    }

    console.error("Error adding unit:", error);

    return res.status(500).json({
      message: "Server error while adding the unit.",
    });
  }
});

// GET /api/properties?companyId=COMP_001 — list one company's units.
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

    // Always filter by companyId to prevent cross-company data mixing.
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

// PUT /api/properties/:id — edit a unit belonging to the specified company.
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid property ID.",
      });
    }

    if (typeof companyId !== "string" || !companyId.trim()) {
      return res.status(400).json({
        message: "Company ID is required.",
      });
    }

    const errors = validateUnitInput(req.body, true);

    if (errors.length) {
      return res.status(400).json({
        message: errors[0],
        errors,
      });
    }

    await migrateMaintenanceRecords();

    const updates = {};
    const fields = [
      "propertyName",
      "buildingNumber",
      "unitNumber",
      "tenantName",
      "tenantContact",
      "annualRent",
      "status",
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.propertyName !== undefined) {
      if (
        typeof updates.propertyName !== "string" ||
        !updates.propertyName.trim()
      ) {
        return res.status(400).json({
          message: "Property name cannot be empty.",
        });
      }
      updates.propertyName = updates.propertyName.trim();
    }

    if (updates.unitNumber !== undefined) {
      updates.unitNumber = updates.unitNumber.trim();
    }

    if (updates.annualRent !== undefined) {
      updates.annualRent = Number(updates.annualRent);
    }

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
        message: "Please check the submitted unit details.",
        errors: Object.values(error.errors ?? {}).map(
          (item) => item.message
        ),
      });
    }

    console.error("Error updating unit:", error);

    return res.status(500).json({
      message: "Server error while updating the unit.",
    });
  }
});

export default router;
