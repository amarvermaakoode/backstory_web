const ShippingSetting = require("../../models/shippingSetting");

// Get active shipping settings (create default if none exists)
exports.getShippingSettings = async (req, res) => {
  try {
    let setting = await ShippingSetting.findOne();
    if (!setting) {
      setting = await ShippingSetting.create({
        standard: {
          rate: 0,
          deliveryDays: "3–5 business days",
          freeThreshold: 999,
        },
        express: {
          rate: 150,
          deliveryDays: "1–2 business days",
        },
        international: {
          rate: 638,
          deliveryDays: "7–14 business days",
        },
      });
    }

    return res.status(200).json({
      success: true,
      shippingSetting: setting,
    });
  } catch (error) {
    console.error("Error fetching shipping settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch shipping settings",
      error: error.message,
    });
  }
};

// Update shipping settings (Admin only)
exports.updateShippingSettings = async (req, res) => {
  try {
    const { standard, express, international } = req.body;

    let setting = await ShippingSetting.findOne();
    if (!setting) {
      setting = new ShippingSetting();
    }

    if (standard) {
      if (standard.rate !== undefined) {
        setting.standard.rate = Math.max(0, Number(standard.rate) || 0);
      }
      if (standard.deliveryDays !== undefined) {
        setting.standard.deliveryDays = String(standard.deliveryDays).trim();
      }
      if (standard.freeThreshold !== undefined) {
        setting.standard.freeThreshold = Math.max(
          0,
          Number(standard.freeThreshold) || 0
        );
      }
    }

    if (express) {
      if (express.rate !== undefined) {
        setting.express.rate = Math.max(0, Number(express.rate) || 0);
      }
      if (express.deliveryDays !== undefined) {
        setting.express.deliveryDays = String(express.deliveryDays).trim();
      }
    }

    if (international) {
      if (international.rate !== undefined) {
        setting.international.rate = Math.max(
          0,
          Number(international.rate) || 0
        );
      }
      if (international.deliveryDays !== undefined) {
        setting.international.deliveryDays = String(
          international.deliveryDays
        ).trim();
      }
    }

    await setting.save();

    return res.status(200).json({
      success: true,
      message: "Shipping rates updated successfully",
      shippingSetting: setting,
    });
  } catch (error) {
    console.error("Error updating shipping settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update shipping rates",
      error: error.message,
    });
  }
};
