use crate::{
    context::Context,
    contract::{Failure, success},
};
use actix_web::{HttpResponse, http::StatusCode, web};
use serde::Deserialize;
use serde_json::{Value, json};
use std::{collections::HashMap, sync::RwLock, time::Duration};

pub struct Tenant {
    pub id: &'static str,
    pub en: &'static str,
    pub ar: &'static str,
}

#[derive(Clone)]
struct Copy {
    heading: String,
    summary: String,
    text: String,
}

#[derive(Clone)]
struct Entry {
    id: String,
    en: Copy,
    ar: Copy,
}

impl Entry {
    fn value(&self, language: &str) -> Value {
        let copy = if language == "ar" { &self.ar } else { &self.en };
        json!({"id":self.id, "heading":copy.heading, "summary":copy.summary, "text":copy.text})
    }
}

pub struct State {
    pub tenants: HashMap<String, Tenant>,
    pub editor_token: Option<String>,
    entries: RwLock<HashMap<String, Vec<Entry>>>,
}

impl State {
    pub fn new(editor_token: Option<String>) -> Self {
        let tenants: HashMap<String, Tenant> = HashMap::from([
            (
                "comstrx.localhost".into(),
                Tenant {
                    id: "comstrx",
                    en: "comstrx",
                    ar: "كومستركس",
                },
            ),
            (
                "studio.localhost".into(),
                Tenant {
                    id: "studio",
                    en: "Demo studio",
                    ar: "استوديو تجريبي",
                },
            ),
        ]);
        let entries = tenants
            .iter()
            .map(|(host, tenant)| {
                (
                    host.clone(),
                    vec![Entry {
                        id: format!("{}-hello", tenant.id),
                        en: Copy {
                            heading: format!("Hello from {}", tenant.en),
                            summary: "Public demonstration content".into(),
                            text: "Tenant-scoped content served by Actix.".into(),
                        },
                        ar: Copy {
                            heading: format!("مرحبًا من {}", tenant.ar),
                            summary: "محتوى تجريبي عام".into(),
                            text: "محتوى معزول لكل مستأجر من Actix.".into(),
                        },
                    }],
                )
            })
            .collect();
        Self {
            tenants,
            editor_token,
            entries: RwLock::new(entries),
        }
    }
}

async fn content(state: web::Data<State>, context: Context) -> HttpResponse {
    let tenant = &state.tenants[&context.tenant];
    success(
        json!({
            "brand": {"label": if context.language=="ar" {tenant.ar}else{tenant.en}, "logo": "/assets/images/brand/logo.webp"},
            "footer": {"about": "Public site content", "items": [{"text":"Home","url":"/","private":"discarded"}]},
            "page": {"heading": if context.language=="ar" {"مرحبًا بالعالم"}else{"Hello world"}},
            "private": "not part of the frontend contract"
        }),
        &context.trace,
        None,
    )
}

async fn settings(context: Context) -> HttpResponse {
    success(
        json!({
            "settings": {"locale": context.language, "languages": ["en", "ar"], "money": context.currency},
            "preferences": {"language": context.language, "currency": context.currency},
            "internal": "not part of the frontend contract"
        }),
        &context.trace,
        None,
    )
}

async fn seo(
    state: web::Data<State>,
    context: Context,
    page: web::Path<String>,
) -> Result<HttpResponse, Failure> {
    if page.as_str() != "home" {
        return Err(Failure(StatusCode::NOT_FOUND, "page_not_found"));
    }
    let tenant = &state.tenants[&context.tenant];
    let (heading, summary) = if context.language == "ar" {
        (
            "مرحبًا بالعالم",
            format!("{} — بيانات SEO مباشرة من واجهة Rust.", tenant.ar),
        )
    } else {
        (
            "Hello world",
            format!("{} — live SEO from the Rust API.", tenant.en),
        )
    };
    Ok(success(
        json!({"heading":heading,"summary":summary,"tags":["software","systems"],"indexable":true,"preview":"large","kind":"website","publisher":tenant.en}),
        &context.trace,
        None,
    ))
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Browse {
    p: Option<usize>,
    size: Option<usize>,
    q: Option<String>,
}

async fn list(
    state: web::Data<State>,
    context: Context,
    query: web::Query<Browse>,
) -> Result<HttpResponse, Failure> {
    let page = query.p.unwrap_or(1);
    let size = query.size.unwrap_or(20);
    if !(1..=100000).contains(&page)
        || !(1..=100).contains(&size)
        || query.q.as_ref().is_some_and(|value| value.len() > 200)
    {
        return Err(Failure(StatusCode::BAD_REQUEST, "invalid_pagination"));
    }
    let entries = state
        .entries
        .read()
        .map_err(|_| Failure(StatusCode::SERVICE_UNAVAILABLE, "busy"))?;
    let search = query.q.as_deref().unwrap_or("").to_lowercase();
    let matching: Vec<_> = entries[&context.tenant]
        .iter()
        .filter(|entry| {
            let text = if context.language == "ar" {
                &entry.ar.heading
            } else {
                &entry.en.heading
            };
            text.to_lowercase().contains(&search)
        })
        .collect();
    let total = matching.len();
    let payload: Vec<_> = matching
        .into_iter()
        .skip((page - 1) * size)
        .take(size)
        .map(|entry| entry.value(&context.language))
        .collect();
    Ok(success(
        json!(payload),
        &context.trace,
        Some(json!({"current":page,"size":size,"count":total,"last":total.div_ceil(size)})),
    ))
}

async fn read(
    state: web::Data<State>,
    context: Context,
    id: web::Path<String>,
) -> Result<HttpResponse, Failure> {
    let entries = state
        .entries
        .read()
        .map_err(|_| Failure(StatusCode::SERVICE_UNAVAILABLE, "busy"))?;
    let entry = entries[&context.tenant]
        .iter()
        .find(|entry| entry.id == *id)
        .ok_or(Failure(StatusCode::NOT_FOUND, "entry_not_found"))?;
    Ok(success(
        entry.value(&context.language),
        &context.trace,
        None,
    ))
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Change {
    heading: Option<String>,
    summary: Option<String>,
    text: Option<String>,
}

impl Change {
    fn validate(&self, create: bool) -> Result<(), Failure> {
        if (create
            && self
                .heading
                .as_ref()
                .is_none_or(|value| value.trim().is_empty()))
            || (self.heading.is_none() && self.summary.is_none() && self.text.is_none())
            || self
                .heading
                .as_ref()
                .is_some_and(|value| value.len() > 10000)
            || self
                .summary
                .as_ref()
                .is_some_and(|value| value.len() > 10000)
            || self.text.as_ref().is_some_and(|value| value.len() > 100000)
        {
            return Err(Failure(StatusCode::UNPROCESSABLE_ENTITY, "invalid_fields"));
        }
        Ok(())
    }
    fn apply(&self, copy: &mut Copy) {
        if let Some(value) = &self.heading {
            copy.heading = value.clone();
        }
        if let Some(value) = &self.summary {
            copy.summary = value.clone();
        }
        if let Some(value) = &self.text {
            copy.text = value.clone();
        }
    }
}

async fn create(
    state: web::Data<State>,
    context: Context,
    change: web::Json<Change>,
) -> Result<HttpResponse, Failure> {
    context.write()?;
    change.validate(true)?;
    let mut entries = state
        .entries
        .write()
        .map_err(|_| Failure(StatusCode::SERVICE_UNAVAILABLE, "busy"))?;
    let items = entries
        .get_mut(&context.tenant)
        .ok_or(Failure(StatusCode::NOT_FOUND, "unknown_tenant"))?;
    if items.len() >= 100 {
        return Err(Failure(StatusCode::CONFLICT, "demo_capacity"));
    }
    let mut copy = Copy {
        heading: String::new(),
        summary: String::new(),
        text: String::new(),
    };
    change.apply(&mut copy);
    let entry = Entry {
        id: uuid::Uuid::new_v4().to_string(),
        en: copy.clone(),
        ar: copy,
    };
    let value = entry.value(&context.language);
    items.push(entry);
    Ok(success(value, &context.trace, None))
}

async fn update(
    state: web::Data<State>,
    context: Context,
    id: web::Path<String>,
    change: web::Json<Change>,
) -> Result<HttpResponse, Failure> {
    context.write()?;
    change.validate(false)?;
    let mut entries = state
        .entries
        .write()
        .map_err(|_| Failure(StatusCode::SERVICE_UNAVAILABLE, "busy"))?;
    let entry = entries
        .get_mut(&context.tenant)
        .and_then(|items| items.iter_mut().find(|entry| entry.id == *id))
        .ok_or(Failure(StatusCode::NOT_FOUND, "entry_not_found"))?;
    change.apply(if context.language == "ar" {
        &mut entry.ar
    } else {
        &mut entry.en
    });
    Ok(success(
        entry.value(&context.language),
        &context.trace,
        None,
    ))
}

async fn delete(
    state: web::Data<State>,
    context: Context,
    id: web::Path<String>,
) -> Result<HttpResponse, Failure> {
    context.write()?;
    let mut entries = state
        .entries
        .write()
        .map_err(|_| Failure(StatusCode::SERVICE_UNAVAILABLE, "busy"))?;
    let items = entries
        .get_mut(&context.tenant)
        .ok_or(Failure(StatusCode::NOT_FOUND, "unknown_tenant"))?;
    let index = items
        .iter()
        .position(|entry| entry.id == *id)
        .ok_or(Failure(StatusCode::NOT_FOUND, "entry_not_found"))?;
    items.remove(index);
    Ok(success(Value::Null, &context.trace, None))
}

async fn events(
    state: web::Data<State>,
    path: web::Path<(String, String)>,
) -> Result<HttpResponse, Failure> {
    let (tenant, language) = path.into_inner();
    if !state.tenants.contains_key(&tenant) {
        return Err(Failure(StatusCode::NOT_FOUND, "unknown_tenant"));
    }
    if !["en", "ar"].contains(&language.as_str()) {
        return Err(Failure(StatusCode::BAD_REQUEST, "unsupported_language"));
    }
    let stream = futures_util::stream::unfold(
        (0u32, tenant, language),
        |(sequence, tenant, language)| async move {
            if sequence >= 120 {
                return None;
            }
            if sequence > 0 {
                actix_web::rt::time::sleep(Duration::from_secs(15)).await;
            }
            let data = json!({"tenant":tenant,"language":language,"sequence":sequence});
            Some((
                Ok::<_, actix_web::Error>(web::Bytes::from(format!(
                    "id: {sequence}\nevent: ready\ndata: {data}\n\n"
                ))),
                (sequence + 1, tenant, language),
            ))
        },
    );
    Ok(HttpResponse::Ok()
        .insert_header(("Content-Type", "text/event-stream"))
        .insert_header(("Cache-Control", "no-store"))
        .insert_header(("X-Accel-Buffering", "no"))
        .streaming(stream))
}

pub fn routes(config: &mut web::ServiceConfig) {
    config.service(
        web::scope("/v1")
            .route("/content", web::get().to(content))
            .route("/settings", web::get().to(settings))
            .route("/seo/{page}", web::get().to(seo))
            .route("/entries", web::get().to(list))
            .route("/entries", web::post().to(create))
            .route("/entries/{entry}", web::get().to(read))
            .route("/entries/{entry}", web::patch().to(update))
            .route("/entries/{entry}", web::delete().to(delete))
            .route("/events/{tenant}/{language}", web::get().to(events)),
    );
    config.route(
        "/health",
        web::get().to(|| async { HttpResponse::Ok().json(json!({"ok":true})) }),
    );
    config.default_service(web::to(|| async {
        Err::<HttpResponse, _>(Failure(StatusCode::NOT_FOUND, "route_not_found"))
    }));
}
