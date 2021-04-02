use std::{sync::Arc, thread};

use async_std::sync::Mutex;
use color_eyre::eyre::Context;
use femme::LevelFilter;
use log::{debug, error, info, trace, warn};
use serialport::SerialPort;
use tide::{http::headers::HeaderValue, security::CorsMiddleware, sse};

mod ingest;
mod routes;
mod serial;
mod telemetry;

pub type State = Arc<Mutex<Option<Box<dyn SerialPort>>>>;

#[async_std::main]
async fn main() -> color_eyre::Result<()> {
    color_eyre::install()?;

    femme::with_level(LevelFilter::Debug);

    let mut app = tide::with_state::<State>(Arc::new(Mutex::new(None)));

    app.with(
        CorsMiddleware::new()
            .allow_methods("GET".parse::<HeaderValue>().unwrap())
            .allow_origin("*")
            .allow_credentials(false),
    );

    app.at("/history/:key");
    app.at("/measurements")
        .get(routes::measurements::all_measurements);
    app.at("/measurements/:key");

    app.at("/config/devices").get(routes::config::list_devices);
    app.at("/config/devices/connect")
        .post(routes::config::device_connect);
    app.at("/config/devices/disconnect")
        .post(routes::config::device_disconnect);

    app.at("/events")
        .get(sse::endpoint(routes::events::sse_handler));

    app.at("/").all(routes::default);
    app.at("/*").all(routes::default);

    // thread::spawn(ingest_main);

    app.listen("0.0.0.0:13705")
        .await
        .wrap_err("Failed to start telemetry server")?;

    Ok(())
}
