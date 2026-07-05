// Dynamic config wrapper around app.json.
// google-services.json is gitignored (repo history was sanitized), so EAS
// builds receive it via the GOOGLE_SERVICES_JSON file env var (type: file,
// visibility: secret, set in BOTH production and preview environments).
// Locally the file exists on disk, so app.json's relative path still works.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON || config.android.googleServicesFile,
  },
});
