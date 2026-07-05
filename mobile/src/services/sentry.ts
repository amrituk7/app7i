import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN || "";

export function initSentry() {
  if (!dsn) return;

  Sentry.init({
    dsn,
    enabled: true,
    environment: process.env.EXPO_PUBLIC_APP_ENV || (__DEV__ ? "development" : "production"),
    tracesSampleRate: __DEV__ ? 1 : 0.2,
  });
}

export function wrapWithSentry<T>(component: T): T {
  return dsn ? (Sentry.wrap(component as never) as T) : component;
}

export function captureAppException(error: unknown, context?: Record<string, unknown>) {
  if (!dsn) return;
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}
