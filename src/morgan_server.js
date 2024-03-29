/* @flow */
"use strict";

const express = require("express");
const winston = require("winston");
const morgan = require("morgan");
const fs = require("fs");

const app = express();

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: "info",
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.label({ label: "serv" }),
        winston.format.timestamp(),
        winston.format.printf(
          msg =>
            `${msg.timestamp} [${msg.label}] ${msg.level} ${
              msg.message
            }`
        )
      )
    }),
    new winston.transports.File({
      filename: "serv_error.txt.log",
      level: "warn",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(
          msg =>
            `${msg.timestamp} [serv] ${msg.level} ${
              msg.message
            }`
        )
      )
    }),
    new winston.transports.File({
      filename: "serv_error.json.log",
      level: "warn"
    })
  ]
});

const morganStream = fs.createWriteStream("serv_http_errors.log", {
  flags: "a"
});

app.use(
  morgan(
    (tokens, req, res) =>
      `${new Date().toISOString()} [http] ` +
      `${tokens.method(req, res)} ${tokens.url(req, res)}`,
    {
      immediate: true,
      stream: morganStream
    }
  )
);

app.use(
  morgan(
    `:date[iso] [http] ` +
    `:method :url (:status) :res[content-length] - :response-time ms`,
    {
      skip: (req, res) => res.statusCode < 400,
      stream: morganStream
    }
  )
);

app.get("/", (req, res) => {
  logger.info("Doing some processing...");
  logger.debug("Some fake step 1; starting");
  logger.debug("Some fake step 2; working");
  logger.debug("Some fake step 3; finished!");
  res.send("Winston server!");
});

app.get("/xyzzy", (req, res) => {
  logger.info("Adventurer says 'XYZZY'");
  res.say_xyzzy(); // this will fail
  res.send("Nothing happens.");
});

app.use((req, res) => {
  logger.warn(`UNKNOWN ROUTE ${req.originalUrl}`);
  res.status(404).send("NOT FOUND");
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(`GENERAL ERROR ${err.message}\n${err.stack}`);
  res.status(500).send("INTERNAL SERVER ERROR");
});

app.listen(8080, () => {
  logger.info("Ready at http://localhost:8080");
});
