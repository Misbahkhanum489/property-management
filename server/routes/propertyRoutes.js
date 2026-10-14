
import express from "express";
import Property from "../models/Property.js";

const router = express.Router();

// POST /api/properties
router.post("/", async (req, res) => {
  try {
    const { companyId, unitNumber } = req.body;

    if (
      !companyId ||
      !String(companyId).trim() ||
      !unitNumber ||
      !String(unitNumber).trim()
    ) {
      return res.status(400).json({
        message: "companyId and unitNumber are required",
      });
    }

    const property = await Property.create(req.body);

    return res.status(201).json({
      message: "Property created successfully",
      property,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This unit already exists for this company",
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid property data",
        error: error.message,
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// GET /api/properties?companyId=...
router.get("/", async (req, res) => {
  try {
    const companyId = req.query.companyId;

    if (!companyId || !String(companyId).trim()) {
      return res.status(400).json({
        message: "companyId query parameter is required",
      });
    }

    const properties = await Property.find({
      companyId: String(companyId).trim(),
    });

    return res.status(200).json({
      count: properties.length,
      properties,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;
