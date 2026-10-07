# ✨ Web

A spec-driven Next.js client site over the `zainlak/server` backend. The core (`src/`, `public/`, `messages/`, `tools/`, `tests/`) holds no project branches; a site is a spec under `specs/<name>`, and its screens are built from the schema alone: components, layout and API calls, no code. The site renders without a backend: every document falls back to the spec.

## Requirements

- Node.js 24 (`.node-version`), pnpm 12.6.0 (`packageManager`).
- Every environment variable is optional; `.env.example` lists them. In development `NEXT_PUBLIC_DEV_TENANT` browses `localhost` as a tenant the backend knows.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server on port 3001 after compiling the selected spec. Restart it after spec, element, component or message changes. |
| `pnpm build` | `next build`, then a source-free standalone release in `.next/standalone` with a hash-verified asset manifest. The release fails when a front credential or a development-only URL appears in a built chunk. One compiler and one release writer per workspace: a concurrent build of the same spec is not supported, and the release check refuses a snapshot that disagrees with the build. |
| `pnpm start` | Runs the standalone release. |
| `pnpm check` | Biome, the layer law, message parity, spec compilation. |
| `pnpm typecheck` | Route types, then `tsc --noEmit`. |
| `pnpm test` | `node --test tests/*/index.ts`. `pnpm test:update` refreshes the goldens; review their diff like code. |
| `pnpm verify` | Check, typecheck, test and build in one run. |

## Layers

`tools/architecture` (part of `pnpm check`) enforces the order below over values and types alike, forbids import cycles, third-party imports outside `lib/providers`, `fetch` outside `src/api`, HTML and styling outside `elements`/`icons`, and direct spec imports. Declaration files (`types/`, the specs, `lib/spec/define`) may take types from above; nothing else may.

1. `lib/std` (framework-free), `lib/providers` (the only doors to third-party packages), `types`, the specs, `lib/spec/define`.
2. The API protocol: `api/{contract,wire,request,response,system,client,error,realtime}.ts`, flat, one job each.
3. `lib/spec`: `define` (the screen language), `shapes` (what a spec and a compiled screen look like), `kinds` (the contract of an element or component), `compile` (config + screens → one checked artifact), `runtime` (binding values, conditions and calls to a scope), `status` (loading/empty/error for a read), and the compiled spec behind `@spec/*`.
4. `lib/site` (request identity, preferences, settings) and `lib/observe` (logs and browser signals).
5. The API doors: `api/server.ts`, `api/browser.ts`, `api/remote.ts`, `api/actions.ts`.
6. `lib/seo`.
7. `stores`, then `hooks`, then `elements`/`icons`, then `components`, then `app` with `proxy.ts` and the instrumentation files.

Three UI layers, each with one job:

- `elements/<name>.tsx` + `elements/<name>.ts`: markup and tokens only (Tailwind through `tailwind-variants`), one element per file, no element imports another, no logic. The `.ts` beside it is the element's contract (`kind({ is, props, slots, events, client })`); the `.tsx` implements it and is imported with its extension (`@/elements/button.tsx`).
- `components/<name>.tsx` + `components/<name>.ts` (+ `hooks/use-<name>.ts` when it has state, effects or calls): composition of elements and smaller components under one piece of behaviour; zero HTML and zero `className`. A stateless component stays a server component.
- `specs/<name>/schema/<screen>.ts`: one file per screen, built from components, layout and API calls.

The core knows no product feature: `src/api` speaks the backend's protocol (headers, envelope, tenancy, auth, cache, retries, realtime) and sends whatever path the schema names.

## Specs

`NEXT_PUBLIC_SPEC` selects the spec folder; empty selects the first installed one, anything unresolved fails the build. A spec is data only: no branching, no calls beyond the typed `defineConfig`/`defineSchema`.

- `config/contents`: the site document in blocks (`infos`, `urls`, `logos`, `address`, `contacts`, `links`) plus the page SEO defaults in `seo`.
- `config/settings`: locale, currency and theme choices, motion, density, maintenance, fonts, `mediaOrigins`.
- `config/themes`: the light and dark palettes.
- `config/contracts`: `urls`, `options`, `request`, `response`, `realtime` (below).
- `config/features`: the machine's own operations (`content`, `settings`, `seo`, `policy`, `sitemap`, `locales`, `currencies`, `broadcast`) each `true`, `false` or a wire override, plus any backend feature name (the first path segment, `orders`, `cart`, …) as a `true`/`false` kill switch for the schema's calls.
- `schema/`: one file per screen, gathered by `schema/index.ts`; nothing is shared between screens on purpose. `brand/`: images, videos, audios, fonts, licenses, well-known files and message overrides over the core defaults.

Every switch is a key with its default written out, so a change is one value, and the machine never guesses:

- `contracts.urls: { production, local, browser }` — the backend origin per build mode, no path; `null` means no backend in that mode; `browser` is another origin the browser reaches (`null` = the same).
- `contracts.options` — `prefix` (`v1`, held in every mode; the core derives `origin/prefix` and the broadcast root `origin`), `spec`, `authCookie`, `proxies`, `browser`, `timeoutMs`, `retries`, `maxResponseBytes`, `credentials`, and the wire defaults `execution`, `encoding`, `cache`.
- `contracts.request` / `contracts.response` — header names, field renames and envelope paths every operation starts from.
- `contracts.realtime: { transport, channels }` — channel names only; the socket (scheme, host, port, key) is what the backend publishes in `GET /v1/contract`, read at boot with the policy document.
- The tenant is never declared: it is the request host, sent as `X-Tenant-Domain`; the backend resolves it against its domain table.
- `features.<feature>: true | false | { …overrides, operations: { <operation>: true | false | { …overrides } } }` — for the machine's operations `false` turns one off (documents then answer from the spec) and an object overrides the wire (method, path, cache, connection, execution, encoding, `request.headers`, `request.fields`, `response`); for a backend feature the value is the switch. Unknown keys are rejected by path.

## Screens

A screen is `screen({ id, path, title, description, layout, access?, redirect?, state?, watch?, seo?, feed?, types?, article?, indexable? })`. The screen never calls the API itself: reads belong to **zones** and named components, and everything comes from `lib/spec/define`.

- **Layout:** `zone(name, { read?, when?, gap, padding, width, surface }, [children])` is a named block that owns one read, shows its loading/error state and publishes its data under its name; `split([2, 1], [[...], [...]], { gap })`, `grid(columns, [...])`, `stack([...])` and `row([...])` divide the screen. Kinds are `c.<component>(name?, settings, slots?)` and `e.<element>(...)`, typed from `components/index.ts` and `elements/index.ts`; a first string argument is the node's name. Settings are the kind's props plus `id`, `name`, `when`, `on`, `read`, `items`, `watch`.
- **Sources:** every named read (`zone("cart", { read })`, `c.cards("similar", { read })`) is a source visible from anywhere in the screen as `from("cart.items")`. Scope roots: `param("id")`, `query("q")`, `state("tab")`, `session("user.name")`, `site("content.name")`, `item("id")` (the nearest list row), `form("email")` (the nearest form's values), `event("key")` (the handler's payload), `result("id")` (the last `call` in an effect chain); `from("root.path", as?)` is the long form, `as` converts (`id`, `number`, `boolean`, `date`, `text`), strings interpolate `{item.id}`. `t("home.title")` is a message.
- **API:** `api.get | post | put | patch | del(path, inputs?)` — the backend path without the prefix (`cart/{cartId}/increment`), inputs bind fields and path parameters (screen parameters bind by name); a read chains `.cache(30)` (server-side seconds), `.map({ data, fields })` (re-maps the envelope), `.every(15)` (polls) and `.live("order")` (re-reads on a broadcast topic). A node's `read` runs on the server for the first paint and on the client afterwards; `items: from("cart.items")` lists a value instead; a form's `options: api.get("gateways")` loads choices.
- **Conditions:** `is(x)`, `not(x)`, `eq(a, b)`, `auth(true | false)`, `all(...)`, `any(...)` over values and references.
- **Effects:** `on: { <event>: [effects] }` with the events the kind's contract declares (a table or cards also emit their action keys); effects run in order and stop on failure: `act.call(api…)`, `act.set("line", value)`, `act.toggle("x")`, `act.go(href)`, `act.open(name)`, `act.close(name)`, `act.refresh(source | "page")`, `act.reset(form)`, `act.session(value | null)`, `act.emit(event)`. `watch(state("tab"), ...effects)` reacts to a change, on a node or on the screen.
- **Overlays:** a named `popup` or `confirm` opens with `act.open(name)` and closes with `act.close(name)` or its own dismiss; its slot is any subtree.
- **Access:** `access: "user" | "guest"` gates the screen on the stored session and redirects to `redirect`. `seo: { zone, title, description, image }` names the source the crawler, canonical URL and feed describe.

The compiler (`pnpm spec`, also on every dev boot and build) resolves every node against its kind's contract (props, slots, events), every reference against the screen (parameters, state, sources, lists, forms, handlers), every effect target (state keys, named nodes, sources, forms), names used twice, sources reading each other in a circle, and decides the Server/Client boundary per node: a node is client when its kind is interactive, when it depends on `state`, `session`, `form`, `event`, `result` or a client-only source, when it has `on` or `watch`, when it is conditioned on the session, or when the screen is gated. Server nodes read inside Suspense and a source is read once per request however many nodes use it; a client subtree is one island with its own error boundary, handed the sources it uses and primed with the server's read when its inputs are server-known. A mistake is named by node path (`checkout.1.children.0: table emits no pick.`). The compiler writes one import registry per build so a screen loads only the kinds it uses.

Every read answers loading, empty and error states on the component itself (`elements/notice`, `elements/skeleton`), with the backend's `reason` translated through `errors.<reason>` and field errors mapped onto form fields. A failing node never blanks the screen.

## Locales and preferences

- The URL carries the locale: a prefixed path renders that locale; a bare path renders the default unless the visitor's saved language differs, then it redirects 307. `src/proxy.ts` rewrites to `app/[locale]` and hands the locale over as `x-locale`. Canonical URLs drop the default prefix; `hreflang` (with `x-default`), Open Graph locales and the sitemap cover every enabled locale. Build internal links with `localePath`.
- Language, currency, country and location are preferences. A guest keeps them in cookies, seeded on the first request from `Accept-Language`, the edge country header and that country's currency, and validated against what the site enables. A signed-in user keeps them on the account (`PUT /account/settings`, `PUT /account/location`); a session starts with `join(token, user, origin)`, where `"register"` pushes the guest's preferences up and `"login"` applies the account's over the cookies.
- The site's own documents are read in the spec's default currency, never the visitor's: the backend refuses a currency it does not display.
- The location is asked once, on the first click or key press; a refusal is remembered. The theme stays with the theme provider (applied before paint) and follows the same account rules.

## SEO

- `seo.remote` per screen: `optional` (default: `GET /v1/content/seo/{page}`, best-effort), `required` (failing), `none`. A screen with a `seo.zone` takes its title, description, image, dates and written locales from that source's row (`seo.title`/`description`/`image` may point at fields with `from`), and `feed` names the sitemap feed the screen lists.
- Entity URLs are `/{page}/{id}-{slug}` when the page's single parameter binds as an id: the id resolves, the slug carries keywords, and a stale or foreign slug answers `308` to the canonical URL. Canonical URLs and `hreflang` use only the locales a row is written in.
- JSON-LD types an entity by its capabilities (`Event`, `LodgingBusiness`, `Trip`, `TouristTrip`, `Product`, `Service`) with offers and rating; `Organization`, `WebSite`, `WebPage`/`BlogPosting` and breadcrumbs ride every page. Names reach titles and graphs as plain text.
- Site-wide verification tokens, the Twitter handle, the default share image and the tenant `indexable` switch come from the site document; indexing also needs `contents.seo.indexable` and a production build.
- The sitemap is split: `/sitemap/pages.xml` plus one file per 10,000-row page of each feed a page names, all listed in `robots.txt`; a failed feed contributes no files.

## Backend contract

- `src/api` is the only door to the backend: the machine's own operations (site document, settings, SEO, policy, sitemap, locales, currencies, broadcast auth) are typed zod endpoints in `api/system.ts`; every other call is `api.call({ method, path, input, cache?, response? })` on an open wire built from the spec's `contracts` defaults, per-request tenancy, an idempotency key on every write, envelope decoding (`status`, `data`, `message`, `errors`, pagination and aggregates when the answer is a collection) and the feature kill switch. The backend validates; the web shows what it answers.
- A GET that fails in transit or answers `502`, `503` or `504` is retried up to `retries` times with jittered exponential backoff inside the call's own `timeoutMs`; a `Retry-After` above two seconds ends it; writes are never retried.
- The browser loads the API client on the first call: `src/api/browser.ts` is a lazy facade over `src/api/remote.ts`, and the browser projection carries no server-only operation, cookie name or development URL.

## Caching

- The machine's documents carry `cache` in seconds: site documents 60, the contract, locales and currencies 300, the sitemap feed 600. A schema read names its own (`api.get("catalogs/{productId}").cache(30)`), default 0.
- The lifetime applies only to server-side GETs without a session; such a read leaves without the visitor's address or request id and goes to Next's Data Cache, keyed by URL and headers, shared across instances. Signed-in reads bypass every cache. Within one request, identical reads share one response through a per-request memo (`memoReads`, bounded, request-scoped by React `cache`); it never outlives the request.
- Each instance also keeps decoded results for 10 s, in-flight loads included. A definitive failure (404, 410, an operation the spec disabled) is kept for the same 10 s; a transient one is retried at once. There is no invalidation hook: an edit shows within the lifetime plus 10 s.
- Every document has one fallback, `contract.values` — the core defaults merged with the spec at compile time. A read that fails, an operation the spec disabled, a connection without a backend and a document the backend has not written yet all answer that value, silently.

## Observability

Every signal is one JSON line on stdout (`{ level, event, at, …facts }`):

- `api.failure` (network, timeout, decode drift, 5xx, 429, refused input) and `api.slow` (1.5 s on the server, 3 s in the browser), with the call, kind, status, reason, code, the backend's request id and the cause chain. Business 4xx, aborts and `configuration` stay silent.
- `request.failure`: every render, route, action and proxy error, with the digest the visitor sees, the route and the path without its query.
- `api.front.refused`: once per instance, when the backend refuses `FRONT_KEY`.
- `browser.*`: uncaught errors, unhandled rejections, CSP violations, failed or slow calls and island render errors, deduplicated, at most 20 per page, beaconed to `POST /api/signals` (same origin only, 16 KB, strict schema, 60 a minute per address).
- `trace`: the proxy keeps or mints `x-request-id`, forwards it to the render, answers it, and writes it on `<html data-trace>`; every server line and browser signal of that request carries it.

## Production

- `options.proxies` counts the trusted proxies in front of the site: `1` (default) for Vercel or one edge, `2` for a CDN in front of it, `0` when the site faces clients directly. With `1` or more, `X-Forwarded-Host` and `X-Forwarded-Proto` are read and the visitor's address is the `X-Forwarded-For` entry the outermost trusted proxy appended, counted from the end. Counting hops is sound only when every request passes through that many proxies: keep the origin private. With `0`, forwarded headers are ignored and no visitor address reaches the backend. Pin `contents.urls.url` to fix the canonical origin.
- The backend must read `X-Tenant-Domain` (`TENANT_HEADER`) and hold a domain record for each host the site serves.
- The backend counts callers in buckets (1,200 a minute per tenant and account or address). `FRONT_KEY` + `FRONT_SECRET` (a credential the tenant admin mints with the `allow_fronts` scope) make every server-side call send `X-Front-Key` and the visitor as `X-Front-Visitor`, so certified calls spend the visitor's bucket; without them every guest shares the web tier's bucket. `FRONT_KEYS` holds one credential per host when one deployment serves several.
- The CSP is strict and nonce-based; images may come from the API origin and `settings.mediaOrigins`, frames from `settings.frameOrigins` (the map embed), sockets from the API host on any port. Set HSTS at the TLS edge.
- Bind the server to `0.0.0.0` (what `pnpm start` does) or a hostname, never a loopback address.

## CI

`.github/workflows/ci.yaml` installs with the frozen lockfile, then runs Audit (`pnpm audit --prod`, high and above), Check, Typecheck, Test and Build as separate steps on Node 24. Every action is pinned to a full commit SHA.

## Tests

The suites in `tests/lib`, `tests/messages`, `tests/public` and `tests/tools` cover the standard library, message parity, the public tree and the build tools. The API, SEO and runtime suites of the former catalogue machine were removed with it; they return once the screen machine settles.
