use tide::{Body, Request, Result};

use crate::{telemetry::get_telemetry_values, State};

pub async fn all_measurements(req: Request<State>) -> Result<Body> {
    Body::from_json(&get_telemetry_values())
}
