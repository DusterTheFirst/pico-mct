use color_eyre::eyre::Context;
use lazy_static::initialize;
use simplelog::{
    ColorChoice, CombinedLogger, ConfigBuilder, LevelFilter, TermLogger, TerminalMode,
};
use telemetry::TELEMETRY_VALUES;
use tide::{http::headers::HeaderValue, security::CorsMiddleware, sse};

mod ingest;
mod routes;
mod serial;
mod telemetry;

type State = ();

#[async_std::main]
async fn main() -> color_eyre::Result<()> {
    color_eyre::install()?;

    // FIXME: here to catch panics early
    initialize(&TELEMETRY_VALUES);

    CombinedLogger::init(vec![
        TermLogger::new(
            LevelFilter::Trace,
            ConfigBuilder::new()
                .add_filter_allow_str(module_path!())
                .build(),
            TerminalMode::Mixed,
            ColorChoice::Auto,
        ),
        TermLogger::new(
            LevelFilter::Info,
            ConfigBuilder::new()
                .add_filter_ignore_str(module_path!())
                .set_target_level(LevelFilter::Error)
                .build(),
            TerminalMode::Mixed,
            ColorChoice::Auto,
        ),
    ])
    .wrap_err("Failed to initialize logger")?;

    let mut app = tide::new();

    app.with(
        CorsMiddleware::new()
            .allow_methods("GET".parse::<HeaderValue>().unwrap())
            .allow_origin("*")
            .allow_credentials(false),
    );

    app.at("/history/:key").get(routes::history::get_datum);
    app.at("/measurements")
        .get(routes::measurements::all_measurements);
    app.at("/measurements/:key")
        .get(routes::measurements::get_measurement);

    app.at("/devices").get(routes::devices::list_devices);
    app.at("/devices/connect")
        .get(sse::endpoint(routes::devices::device_connect));

    app.at("/health").get(|_| async move { Ok("ok") });

    app.at("/").all(routes::default);
    app.at("/*").all(routes::default);

    app.listen("0.0.0.0:13705")
        .await
        .wrap_err("Failed to start telemetry server")?;

    Ok(())
}
