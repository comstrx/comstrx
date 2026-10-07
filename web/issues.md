# Web → server: open gaps

Round 2026-09-30 (items 1–4: vendor slug, logo dimensions, request id, the cold list) shipped and verified on local Octane; the web mirror now sends and reads `X-Request-Id` / `meta.request_id`, and host URLs carry the slug.

1. **`GET /v1/contract` publishes no route catalogue.** The web now compiles every page against a recorded lockfile of the client routes (`specs/client/routes.json`: `feature.operation` → method, path, JSON Schema inputs and outputs, `many`, cache/execution defaults) and refuses a page that names an unknown route, field or parameter. Today that lockfile is derived from the web's former hand-written catalogue; the backend owns the truth.
   - Expected: a `routes` section in `GET /v1/contract` (or a sibling `GET /v1/contract/routes`, cached with an `ETag` like the contract): for every client and guest route its name, method, uri, path parameters, middleware facts the web must honour (`auth`, `throttle`, `idempotent`), the validated request fields with their rules rendered as JSON Schema (type, required, enum, min/max, format), the answer shape as JSON Schema (the resource's fields, `many` for collections) and the query DSL keys it accepts.
   - Why: the web's `record` tool then rebuilds the lockfile from the backend and CI fails on drift before a page can break; no front hand-writes the API again.

2. **`GET /v1/home/recently-offers` answers 500.** `App\Support\Response::items(): Argument #1 ($items) must be of type array, Illuminate\Http\JsonResponse given` (`HomeService.php:19`). The other two home feeds answer.
   - Reproduce: `GET /v1/home/recently-offers?limit=4` with `X-Tenant-Domain: www.zainlak.com`.

3. **The cart-wide checkout's contract is not the one the route documents.** `POST /v1/cart/checkout` reads `items: [{ id, pay_type, gateway_id, … }]` (each item carries its own settlement; the flat `pay_type`/`gateway_id` of the body are ignored) and mints `quote_token` itself when absent, while the published shape (and the former web catalogue) lists flat settlement fields with `quote_token` required. Without `items` every line answers `409 invalid_state`.
   - Expected: either accept the body's flat settlement as the default for every asked item (`items` optional, `[{ id }]` inheriting `pay_type`, `gateway_id`, `coupon_code`, `notes`), or document `items[]` as the shape and refuse a flat body with `422` naming `items`.
   - The web meanwhile orders line by line through `POST /v1/cart/{cartId}/checkout`, which honours the flat body.
