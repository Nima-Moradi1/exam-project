# Privacy-safe product analytics

The platform emits only the event names defined in `lib/analytics/events.ts`, route, opaque exam ID, category slug, device class, and release identifier. It never emits answers, prompts, search text, names, email addresses, credentials, tokens, recordings, or free-form metadata.

Core measures are catalog-to-detail conversion, start/resume rate, completion rate, result views, and autosave failure rate. Global Privacy Control disables browser telemetry. Operational retention and any consent requirement must be configured with the production telemetry sink before data is retained outside runtime logs.
