use actix_web::{HttpResponse, ResponseError, http::StatusCode};
use serde_json::{Value, json};
use std::fmt;

#[derive(Debug)]
pub struct Failure(pub StatusCode, pub &'static str);

impl fmt::Display for Failure {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.1)
    }
}

impl ResponseError for Failure {
    fn status_code(&self) -> StatusCode {
        self.0
    }

    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.0)
            .insert_header(("Cache-Control", "private, no-store"))
            .json(json!({"ok":false, "payload":null, "notice":self.1, "issues":{}, "trace":uuid::Uuid::new_v4().to_string()}))
    }
}

pub fn success(payload: Value, trace: &str, paging: Option<Value>) -> HttpResponse {
    HttpResponse::Ok()
        .insert_header(("Cache-Control", "private, no-store"))
        .insert_header(("X-Request-Id", trace))
        .json(json!({"ok":true, "payload":payload, "notice":"ok", "issues":{}, "trace":trace, "paging":paging}))
}
