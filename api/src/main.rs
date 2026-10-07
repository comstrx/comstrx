mod context;
mod contract;
mod resources;

use actix_cors::Cors;
use actix_web::{App, HttpServer, middleware, web};
use std::{env, time::Duration};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let bind = env::var("COMSTRX_API_BIND").unwrap_or_else(|_| "127.0.0.1:8100".into());
    let origins = env::var("COMSTRX_ALLOWED_ORIGINS")
        .unwrap_or_else(|_| "http://localhost:3100,http://127.0.0.1:3100".into())
        .split(',')
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
        .collect::<Vec<_>>();
    let token = env::var("COMSTRX_EDITOR_TOKEN")
        .ok()
        .filter(|value| value.len() >= 32);
    let state = web::Data::new(resources::State::new(token));
    println!("comstrx API listening on {bind}");
    HttpServer::new(move || {
        let mut cors = Cors::default()
            .allowed_methods(["GET", "POST", "PUT", "PATCH", "DELETE"])
            .allowed_headers([
                "Accept",
                "Content-Type",
                "Authorization",
                "X-Language",
                "X-Currency",
                "X-Tenant-Host",
                "X-Host",
                "X-Role",
                "X-Request-Id",
            ])
            .max_age(3600);
        for origin in &origins {
            cors = cors.allowed_origin(origin);
        }
        App::new()
            .wrap(cors)
            .app_data(state.clone())
            .app_data(
                web::JsonConfig::default()
                    .limit(131072)
                    .error_handler(|_, _| {
                        contract::Failure(actix_web::http::StatusCode::BAD_REQUEST, "invalid_json")
                            .into()
                    }),
            )
            .app_data(web::QueryConfig::default().error_handler(|_, _| {
                contract::Failure(actix_web::http::StatusCode::BAD_REQUEST, "invalid_query").into()
            }))
            .wrap(middleware::DefaultHeaders::new().add(("X-Content-Type-Options", "nosniff")))
            .configure(resources::routes)
    })
    .workers(2)
    .keep_alive(Duration::from_secs(10))
    .client_request_timeout(Duration::from_secs(5))
    .shutdown_timeout(3)
    .bind(bind)?
    .run()
    .await
}
