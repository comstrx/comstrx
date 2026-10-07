use crate::{contract::Failure, resources::State};
use actix_web::{FromRequest, HttpRequest, dev::Payload, http::StatusCode, web};
use std::future::{Ready, ready};

#[derive(Clone)]
pub struct Context {
    pub tenant: String,
    pub language: String,
    pub currency: String,
    pub editor: bool,
    pub trace: String,
}

fn header<'a>(request: &'a HttpRequest, name: &str) -> Result<&'a str, Failure> {
    let mut values = request.headers().get_all(name);
    let value = values
        .next()
        .ok_or(Failure(StatusCode::BAD_REQUEST, "missing_context"))?;
    if values.next().is_some() {
        return Err(Failure(StatusCode::BAD_REQUEST, "ambiguous_context"));
    }
    value
        .to_str()
        .map_err(|_| Failure(StatusCode::BAD_REQUEST, "invalid_context"))
}

impl Context {
    fn resolve(request: &HttpRequest) -> Result<Self, Failure> {
        let state = request
            .app_data::<web::Data<State>>()
            .ok_or(Failure(StatusCode::INTERNAL_SERVER_ERROR, "unavailable"))?;
        let tenant = header(request, "X-Tenant-Host")?;
        if !state.tenants.contains_key(tenant) {
            return Err(Failure(StatusCode::NOT_FOUND, "unknown_tenant"));
        }
        let language = header(request, "X-Language")?;
        let currency = header(request, "X-Currency")?;
        if !["en", "ar"].contains(&language) || !["USD", "EGP", "SAR"].contains(&currency) {
            return Err(Failure(StatusCode::BAD_REQUEST, "unsupported_preference"));
        }
        let role = header(request, "X-Role")?;
        if !["client", "editor"].contains(&role) {
            return Err(Failure(StatusCode::FORBIDDEN, "unsupported_role"));
        }
        let editor = if role == "editor" {
            let expected = state
                .editor_token
                .as_ref()
                .ok_or(Failure(StatusCode::UNAUTHORIZED, "editor_disabled"))?;
            let supplied = header(request, "Authorization")
                .map_err(|_| Failure(StatusCode::UNAUTHORIZED, "authentication_required"))?;
            let bytes = supplied
                .strip_prefix("Bearer ")
                .ok_or(Failure(StatusCode::UNAUTHORIZED, "invalid_token"))?
                .as_bytes();
            let matched = bytes.len() == expected.len()
                && bytes
                    .iter()
                    .zip(expected.as_bytes())
                    .fold(0u8, |difference, (a, b)| difference | (a ^ b))
                    == 0;
            if !matched {
                return Err(Failure(StatusCode::UNAUTHORIZED, "invalid_token"));
            }
            if tenant != "comstrx.localhost" {
                return Err(Failure(StatusCode::FORBIDDEN, "token_tenant_mismatch"));
            }
            true
        } else {
            false
        };
        let trace = request
            .headers()
            .get("X-Request-Id")
            .and_then(|value| value.to_str().ok())
            .and_then(|value| uuid::Uuid::parse_str(value).ok())
            .unwrap_or_else(uuid::Uuid::new_v4)
            .to_string();
        Ok(Self {
            tenant: tenant.into(),
            language: language.into(),
            currency: currency.into(),
            editor,
            trace,
        })
    }

    pub fn write(&self) -> Result<(), Failure> {
        if self.editor {
            Ok(())
        } else {
            Err(Failure(StatusCode::FORBIDDEN, "editor_required"))
        }
    }
}

impl FromRequest for Context {
    type Error = Failure;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(request: &HttpRequest, _: &mut Payload) -> Self::Future {
        ready(Self::resolve(request))
    }
}
