
import express from "express";
import Company from "../models/Company.js";

const router = express.Router();

// Register a company or update its name
router.post("/", async (req, res) => {
  try {
    const companyId = String(req.body.companyId || "").trim();
    const companyName = String(req.body.companyName || "").trim();

    if (!companyId || !companyName) {
      return res.status(400).json({
        message: "Company ID and company name are required",
      });
    }

    const company = await Company.findOneAndUpdate(
      { companyId },
      { $set: { companyName } },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Company saved successfully",
      company,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Get a company by its ID
router.get("/:companyId", async (req, res) => {
  try {
    const company = await Company.findOne({
      companyId: req.params.companyId.trim(),
    });

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    return res.status(200).json({ company });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;
