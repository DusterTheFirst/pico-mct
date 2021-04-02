use tide::{Request, Response, StatusCode};

use crate::State;

pub mod config;
pub mod measurements;
pub mod events;

pub async fn default(_: Request<State>) -> tide::Result<Response> {
    Ok(Response::builder(StatusCode::NotFound)
        .body("404: Endpoint does not exist")
        .build())
}
