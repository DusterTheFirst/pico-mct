use tide::{Body, Request, Result};

use crate::{
    telemetry::{get_telemetry_composition, get_telemetry_metadata, Identifier},
    State,
};

pub async fn all_measurements(req: Request<State>) -> Result<Body> {
    Body::from_json(&get_telemetry_composition())
}

pub async fn get_measurement(req: Request<State>) -> Result<Body> {
    let key = req.param("key")?;

    Body::from_json(&get_telemetry_metadata(Identifier::from_key(key)))
}
