const bodyParser = require("body-parser");

exports.rawBodyMiddleware = bodyParser.raw({ type: "*/*" });
