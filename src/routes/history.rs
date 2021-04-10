use serde::Deserialize;
use serde_json::json;
use tide::{Body, Request, Result};

use crate::ingest::TIMESCALE_DATA;
use crate::State;

#[derive(Debug, Deserialize)]
struct HistoryDatumQuery {
    start: f64,
    end: f64,
}

pub async fn get_datum(req: Request<State>) -> Result<Body> {
    let query: HistoryDatumQuery = req.query()?;
    let key = req.param("key")?;

    let start = query.start.floor().max(0.0) as u64;
    let end = query.end.ceil().max(0.0) as u64;

    let timescale_data = TIMESCALE_DATA.read().await;

    let data = timescale_data.range(start..end).map(|(running_us, packet)| {
        let unfiltered_datum = serde_json::to_value(packet).expect("Failed to serialize packet as serde_json::Value, this should not be able to happen");

        json!({
            "id": key,
            key: unfiltered_datum[key],
            "running_us": running_us,
        })
    }).collect::<Vec<_>>();

    Body::from_json(&data)
}
