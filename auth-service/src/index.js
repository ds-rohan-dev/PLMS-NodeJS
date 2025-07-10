const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const amqp = require("amqplib/callback_api");
require("dotenv").config();

const { errorHandler } = require("./middlewares/error-handler");
const { NotFoundError } = require("./errors/not-found-error");
const { signinRouter } = require("./routes/signin-route");
const { signupRouter } = require("./routes/signup-route");
const { signoutRouter } = require("./routes/signout-route");

amqp.connect("amqp://localhost", function (error0, connection) {
  if (error0) {
    throw error0;
  }

  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }
    logger.info("Connected to RabbitMQ");

    const app = express();

    app.enable("trust proxy");

    app.use(
      cors({
        origin: "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    app.use(express.json());

    app.use((req, res, next) => {
      req.rabbitChannel = channel;
      next();
    });

    app.use(signinRouter);
    app.use(signupRouter);
    app.use(signoutRouter);

    app.use(async (req, res, next) => {
      next(new NotFoundError());
    });

    app.use(errorHandler);

    const start = async () => {
      const PORT = 8001;

      if (!process.env.JWT_KEY) {
        throw new Error("JWT_KEY must be defined");
      }

      try {
        await mongoose.connect("mongodb://localhost:27017/PLMS-auth");
        logger.info("Connected to MongoDB :]");
      } catch (err) {
        console.log(err);
      }

      channel.assertQueue("loan_created", { durable: true }, (error) => {
        if (error) {
          console.error("Queue assertion error:", error);
          return;
        }

        console.log("Asserted 'loan_created' queue");

        channel.consume(
          "loan_created",
          (msg) => {
            loanCreated(msg, channel);
          },
          { noAck: false }
        );
      });

      app.listen(PORT, () => {
        console.log("Listening on port 8001");
      });
    };

    start();

    process.on("beforeExit", () => {
      console.log("Closing Connection to RabbitMQ!");
      connection.close();
    });
  });
});
