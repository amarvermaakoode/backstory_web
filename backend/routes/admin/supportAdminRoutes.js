const express = require("express");
const router = express.Router();
const {
  getAllSupportTickets,
  updateSupportTicketStatus,
  deleteSupportTicket,
} = require("../../controllers/admin/supportAdminCtrl");
const { protect, adminOnly } = require("../../middlewares/auth");

router.use(protect);
router.use(adminOnly);

router.get("/", getAllSupportTickets);
router.put("/:id", updateSupportTicketStatus);
router.delete("/:id", deleteSupportTicket);

module.exports = router;
