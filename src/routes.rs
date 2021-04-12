use tide::{Request, Response, StatusCode};

use crate::State;

pub mod devices;
pub mod history;
pub mod measurements;

pub async fn default(_: Request<State>) -> tide::Result<Response> {
    Ok(Response::builder(StatusCode::NotFound)
        .body("404: Endpoint does not exist")
        .build())
}
