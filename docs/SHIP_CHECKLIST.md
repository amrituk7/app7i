# Ship Checklist

## Before you switch customers on

1. Deploy the latest web app and functions together.
2. In Google Cloud Monitoring, create an uptime check against `/healthCheck` on your functions host.
3. In Error Reporting, add notification channels for email or Slack.
4. In Firebase Blaze billing, add budget alerts.
5. In Firebase App Check, register the web app and enforce App Check for Firestore, Storage, and Functions.
6. In Stripe, confirm the live price IDs match the plan you want to sell before sending customers through checkout. The functions now prefer `STRIPE_PRICE_INSTRUCTOR` and `STRIPE_PRICE_STUDENT`.

## Recommended first alerts

1. Uptime check failure on the new `healthCheck` endpoint.
2. Error Reporting notifications for new and reopened backend errors.
3. Billing alerts for spend spikes.

## Support

Use `support@app7i.com` as the primary launch support address.
