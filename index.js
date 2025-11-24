const crypto = require("crypto");
const { BigQuery } = require("@google-cloud/bigquery");

exports.shopifyWebhook = async (req, res) => {
  try {
    // Shopify sends HMAC based on raw body, so we must have rawBody
    if (!req.rawBody) {
      console.error("rawBody missing");
      return res.status(400).send("Missing rawBody");
    }

    const secret = process.env.SHOPIFY_SECRET;
    const hmacHeader = req.get("X-Shopify-Hmac-Sha256");

    if (!secret) {
      console.error("Missing SHOPIFY_SECRET");
      return res.status(500).send("Server config error");
    }

    if (!hmacHeader) {
      console.error("No HMAC header");
      return res.status(401).send("Missing HMAC header");
    }

    // Validate HMAC
    const digest = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("base64");

    if (digest !== hmacHeader) {
      console.error("Invalid HMAC");
      return res.status(401).send("Invalid HMAC");
    }

    // Parse JSON body
    let payload;
    try {
      payload = JSON.parse(req.rawBody.toString());
    } catch (e) {
      console.error("JSON parse error:", e);
      return res.status(400).send("Invalid JSON");
    }

    // Insert into BigQuery
    const bq = new BigQuery();
    await bq
      .dataset("shopify_raw")
      .table("webhooks")
      .insert({
        timestamp: new Date().toISOString(),
        data: payload,
      });

    return res.status(200).send("ok");
  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).send("Internal error");
  }
};
