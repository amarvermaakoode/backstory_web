const User = require("../../models/user");
const SupportTicket = require("../../models/supportTicket");
const { sendSupportTicketEmailToAdmin } = require("../../services/emailService");

// create a new support ticket
const createSupportTicket = async (req, res) => {
  try {
    const { subject, message, name, email, phone } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required.",
      });
    }

    let ticketUser = null;
    let ticketName = name || "";
    let ticketEmail = email || "";
    let ticketPhone = phone || "";

    if (req.user) {
      ticketUser = req.user._id || req.user.id;
      ticketName = req.user.name || name || "User";
      ticketEmail = req.user.email || email || "";
      ticketPhone = req.user.phoneNumber || phone || "";
    }

    const ticket = await SupportTicket.create({
      user: ticketUser,
      name: ticketName || "Guest User",
      email: ticketEmail,
      phone: ticketPhone,
      subject: subject.trim(),
      message: message.trim(),
    });

    // Dispatch notification email to admin email(s)
    try {
      const adminUsers = await User.find({ role: "admin" }).select("email");
      const adminEmailsFromDb = adminUsers.map((u) => u.email).filter(Boolean);

      const targetAdminEmails = [
        ...new Set([
          process.env.ADMIN_EMAIL,
          "aditi@akoode.in",
          ...adminEmailsFromDb,
        ].filter(Boolean)),
      ];

      for (const targetEmail of targetAdminEmails) {
        await sendSupportTicketEmailToAdmin({
          ticket,
          adminEmail: targetEmail,
        });
      }
    } catch (emailErr) {
      console.error("[Support] Failed to dispatch admin notification email:", emailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Your message has been submitted successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error("Create support ticket error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get all support tickets for logged-in user
const getUserSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id || req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    console.error("Get user support tickets error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSupportTicket,
  getUserSupportTickets,
};
