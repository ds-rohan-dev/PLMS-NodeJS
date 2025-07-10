const { Review } = require("../models/review");
const logger = require("../utils/logger");

const loanCreated = async (msg, channel) => {
  const eventId = Date.now().toString();

  try {
    logger.info(`[${eventId}] Processing loan created event`, {
      queue: "loan_created",
      eventId,
    });

    const eventLoan = JSON.parse(msg.content.toString());

    const { loan } = eventLoan;

    logger.debug(`[${eventId}] Parsed loan created event data`, {
      loanId: loan.id,
      eventData,
      eventId,
    });

    logger.debug(`[${eventId}] Checking for existing loan`, {
      loanId: loan.id,
      type: "loan_created",
      role: "manager",
      eventId,
    });

    const existingReview = await Review.findById(loan.id);

    if (existingReview) {
      logger.warn(`[${eventId}] Duplicate loan detected`, {
        loanId: loan.id,
        existingNotificationId: existingNotification.id,
        eventId,
      });
      channel.ack(msg);
      return;
    }

    const newReview = new Review({
      _id: loan.id,
      ...loan,
    });

    await newReview.save();

    logger.info(`[${eventId}] loan data saved successfully`, {
      loanId: loan.id,
      notificationId: newNotification.id,
      eventId,
    });

    channel.ack(msg);
  } catch (err) {
    logger.error(`[${eventId}] Error processing loan data`, {
      error: err.message,
      stack: err.stack,
      messageContent: msg.content.toString(),
      eventId,
    });

    channel.nack(msg, false, true);
  }
};

module.exports = loanCreated;
