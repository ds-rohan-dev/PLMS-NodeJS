const { Notification } = require("../models/notification");
const logger = require("../utils/logger");

const loanUpdated = async (msg, channel) => {
  const eventId = Date.now().toString();

  try {
    logger.info(`[${eventId}] Processing loan updated event`, {
      queue: "loan_updated",
      eventId,
    });

    const eventData = JSON.parse(msg.content.toString());

    console.log("Received loan update event.");

    const { review } = eventData;

    const existingNotification = await Notification.findOne({
      loanId: review.id,
      type: review.status === "approved" ? "loan_approved" : "loan_rejected",
      role: "customer",
    });

    if (existingNotification) {
      console.log("Notification already exists for this loan update!");
      channel.ack(msg);
      return;
    }

    const notificationData = {
      userid: review.userid,
      loanId: review.id,
      role: "customer",
      type: review.status === "approved" ? "loan_approved" : "loan_rejected",
      title:
        review.status === "approved"
          ? "Loan Approved!"
          : "Loan Application Update",
      message:
        review.status === "approved"
          ? `Congratulations! Your loan application has been approved.`
          : review.status === "rejected" &&
            `Your loan application has been rejected. Please contact the bank for more details.`,
    };

    const newNotification = new Notification(notificationData);

    console.log("New notification data built!");

    await newNotification.save();

    console.log("New notification saved!");

    channel.ack(msg);
  } catch (err) {
    console.log("Error processing loan update:", err);

    channel.nack(msg, false, true);
  }
};

module.exports = loanUpdated;
