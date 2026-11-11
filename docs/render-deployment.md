# Render deployment: public assignment demo

The current deployment is intentionally public and unauthenticated. Anyone with its URL can read and modify sample data and call enabled AI endpoints. Do not deploy private or production data in this mode. Use only one web instance: snapshot caching and temporary previews are process-local; compare-and-swap fails closed on conflicting database writes, but does not make the app multi-instance safe.

The `render.yaml` blueprint defines a free web service and PostgreSQL database. Supply AI provider keys only through Render's environment settings, not source control. With a public demo, any visitor can use the AI endpoints, so free quota may be exhausted and non-free usage may incur charges. PostgreSQL is required for durable Render free deployment; local files on free web instances are ephemeral. Free PostgreSQL may expire, and the app does not provide backups. Check the current Render terms and project settings.

Open the deployed URL directly; no login is present. Check that the dashboard and sample review flow work. Health endpoint `/api/health` reports database connectivity, not correctness, write durability or uptime. Do not claim independent audit or verified availability without evidence.
