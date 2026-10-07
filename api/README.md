# comstrx API

A small Actix-Web 4.15.0 reference backend for the web runtime's integration proof. This is a local demonstration service, not a production account/payment platform.

```sh
cargo run --release --locked
```

Default bind: 127.0.0.1:8100. COMSTRX_API_BIND can change the listener. The application uses two workers, bounded request bodies, per-request context and bounded in-memory tenant storage. Restarting resets demo content. Cargo.lock pins the complete dependency graph.

Browser requests connect directly. actix-cors 0.7.2 handles preflights and checks an explicit origin/header/method allowlist. COMSTRX_ALLOWED_ORIGINS is a comma-separated list; the local default allows http://localhost:3100 and http://127.0.0.1:3100. Set deployment origins explicitly. HTTP endpoints and public SSE use the same policy; credentialed cookies are not enabled. Bearer authorization is independent of CORS.

Public tenant hosts: comstrx.localhost and studio.localhost. Requests to /v1/content, /v1/seo/home and /v1/entries require X-Tenant-Host, X-Language (en/ar), X-Currency (USD/EGP/SAR) and X-Role (client/editor). Optional X-Request-Id is accepted only as a UUID; otherwise the server generates one. Unknown/ambiguous context fails closed.

```sh
curl http://127.0.0.1:8100/v1/content \
  -H 'X-Tenant-Host: comstrx.localhost' \
  -H 'X-Language: en' -H 'X-Currency: USD' -H 'X-Role: client'
```

Content and settings return nested objects to exercise the web document mapper; SEO includes publisher and image-preview metadata. The existing entries CRUD remains a backend demo, outside the three frontend documents.

The wire envelope intentionally differs from Laravel: ok / payload / notice / issues / trace / paging. Content fields are id / heading / summary / text; query parameters are p / size / q.

| Endpoint | Methods |
| --- | --- |
| /health | GET |
| /v1/content | GET; branding/footer/page document |
| /v1/settings | GET; site options and preferences |
| /v1/seo/{page} | GET; home currently exists |
| /v1/entries | GET, POST |
| /v1/entries/{entry} | GET, PATCH, DELETE |
| /v1/events/{tenant}/{language} | GET, public SSE |

Writes require X-Role: editor plus a valid bearer credential. Set COMSTRX_EDITOR_TOKEN to a random secret of at least 32 characters to enable the demo editor; otherwise it is disabled. That credential grants access only to comstrx.localhost. A role header alone never grants permission, and a valid token cannot edit another tenant. No demo credential is stored in the repository or web specs.

Storage is limited to 100 entries per tenant. Every read and mutation selects the tenant's own collection; foreign record IDs return 404. Public SSE sends tenant/language/sequence metadata only, uses native stream cancellation, and ends after 120 events. It deliberately has no private subscriptions or authenticated application events.

Structure: context.rs owns extraction/authentication; contract.rs owns envelopes/errors; resources.rs owns scoped data and routes; main.rs configures the listener. No database, migrations, external notifications or persistent side effects are involved.

Validation:

```sh
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo build --release --locked
```

Live integration checks exercised CRUD, localized responses, tenant/role denial, query validation and SSE cancellation. The same web adapter also connected to the existing local Zainlak Laravel backend using only another role's specs. See ../web/README.md for the portability boundary.

References: [Actix CORS](https://docs.rs/actix-cors/latest/actix_cors/struct.Cors.html), [Actix application state](https://actix.rs/docs/application/), [server configuration](https://actix.rs/docs/server/).
