const gateway = require("express-gateway");

gateway().run();

console.log("API Gateway service listening at port defined in config!");
