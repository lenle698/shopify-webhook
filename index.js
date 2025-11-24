const crypto = require('crypto');
const {BigQuery} = require('@google-cloud/bigquery');

exports.shopifyWebhook = async (req, res) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const rawBody = req.rawBody;
  const secret = process.env.SHOPIFY_SECRET;

  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  if (digest !== hmac) {
    return res.status(401).send('Unauthorized');
  }

  const payload = JSON.parse(rawBody.toString());
  const bigquery = new BigQuery();

  await bigquery
    .dataset('shopify')
    .table('webhooks')
    .insert({ timestamp: new Date(), data: payload });

  res.status(200).send('ok');
};
