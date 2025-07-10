const { User } = require("../models/user");

const loanCreated = async (msg, channel) => {
  try {
    console.log("\n[New log]:");

    const eventData = JSON.parse(msg.content.toString());

    console.log("Received loan created event.");

    const { userid, updatedUserData } = eventData.loan;

    console.log(userid, updatedUserData);

    const existingUser = await User.findOne({ userid });

    console.log(existingUser);

    if (!existingUser) {
      console.log("No User Found!");

      console.log("Creating a new User!");
    }
  } catch (err) {
    console.log("Error processing loan created event:", err);

    channel.nack(msg, false, true);
  }
};

module.exports = loanCreated;
