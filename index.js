const crypto = require('crypto');
const { BigQuery } = require('@google-cloud/bigquery');

exports.shopifyWebhook = async (req, res) => {
  try {
    // ---- 1. Verify raw body exists ----
    if (!req.rawBody) {
      return res.status(400).send('Missing rawBody');
    }

    // ---- 2. Check HMAC ----
    const secret = process.env.SHOPIFY_SECRET;
    const hmacHeader = req.get("X-Shopify-Hmac-Sha256");

    if (!secret) {
      console.error("Missing SHOPIFY_SECRET env variable");
      return res.status(500).send("Server config error");
    }

    if (!hmacHeader) {
      return res.status(401).send("Missing HMAC header");
    }

    const digest = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("base64");

    if (digest !== hmacHeader) {
      return res.status(401).send("Invalid HMAC");
    }

    // ---- 3. Parse payload ----
    const payload = JSON.parse(req.rawBody.toString());

    // ---- 4. Insert vào BigQuery ----
    const bigquery = new BigQuery();
    await bigquery
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
