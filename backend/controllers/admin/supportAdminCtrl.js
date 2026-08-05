const SupportTicket = require("../../models/supportTicket");

// get all support tickets
const getAllSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate("user", "name email phoneNumber role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    console.error("Get all support tickets error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update support tickets
const updateSupportTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    if (status) {
      ticket.status = status;
    }

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Support ticket status updated successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error("Update support ticket status error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// delete support ticket
const deleteSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findByIdAndDelete(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Support ticket deleted successfully.",
    });
  } catch (error) {
    console.error("Delete support ticket error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllSupportTickets,
  updateSupportTicketStatus,
  deleteSupportTicket,
};
