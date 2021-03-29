use std::{io, sync::mpsc::channel, thread, time::Duration};

use clap::AppSettings::ColoredHelp;
use color_eyre::eyre::Context;
use log::{debug, error, info, trace, warn, LevelFilter, SetLoggerError};
use notify::{watcher, RecursiveMode, Watcher};
use serial::select_serial_port_prompt;
use simplelog::{CombinedLogger, ConfigBuilder, TermLogger, TerminalMode};
use structopt::StructOpt;

mod serial;

#[derive(StructOpt)]
#[structopt(global_setting(ColoredHelp))]
struct CommandLineArguments {
    /// Level of output verbosity
    #[structopt(short, parse(from_occurrences))]
    pub verbose: usize,
    /// The serial port to connect to
    #[structopt(short, long)]
    pub port: Option<String>,
    /// The serial port baud rate (does not matter for USB)
    #[structopt(short, long, default_value("0"))]
    pub baud: u32,
    /// Automatically reconnect if the port disconnects
    #[structopt(short, long)]
    pub reconnect: bool, // TODO: implement
}

fn main() -> color_eyre::Result<()> {
    color_eyre::install()?;

    let args = CommandLineArguments::from_args();

    setup_logger(args.verbose).context("Failed to initialize logger")?;

    let serial_port = if let Some(port) = args.port {
        port
    } else {
        info!("No serial port provided, select one from below");

        if let Some(port) = select_serial_port_prompt()? {
            trace!("User selected item: {:?}", port);

            port.name
        } else {
            warn!("User did not select any port");

            return Ok(());
        }
    };

    let (tx, rx) = channel();

    let mut watcher =
        watcher(tx, Duration::from_secs(1)).context("Failed to setup file watcher")?;

    watcher
        .watch(&serial_port, RecursiveMode::NonRecursive)
        .with_context(|| format!("Failed to watch {}", serial_port))?;

    loop {
        match rx.recv() {
            Ok(event) => println!("{:?}", event),
            Err(e) => println!("watch error: {:?}", e),
        }
    }

    watcher.unwatch(&serial_port);

    // let mut is_reconnecting = false;

    // loop {
    //     let mut serial_port = match serialport::new(&serial_port, args.baud)
    //         .timeout(Duration::from_millis(1000)) // FIXME: better timeout?
    //         .open()
    //     {
    //         Ok(serial_port) => serial_port,
    //         Err(e) => match e.kind() {
    //             serialport::ErrorKind::Io(io::ErrorKind::NotFound) => {
    //                 if is_reconnecting {
    //                     warn!("Serial port does not exist..."); // FIXME: better way to busy wait for the thing to exist (https://github.com/notify-rs/notify)

    //                     thread::sleep(Duration::from_millis(1000));

    //                     continue;
    //                 } else {
    //                     error!("Serial port does not exist. Was it closed?");
    //                     warn!("This can happen if the serial port was closed but the port list was not refreshed.");

    //                     return Ok(());
    //                 }
    //             }
    //             _ => Err(e).with_context(|| format!("Failed to open port {}", serial_port))?,
    //         },
    //     }; // TODO: HANDLE DISCONNECTS (reconnects)

    //     is_reconnecting = false;

    //     // let (mut serial_port_read, mut serial_port_write) = (
    //     //     BufReader::new(
    //     //         serial_port
    //     //             .try_clone()
    //     //             .context("Failed to clone the open serial port")?,
    //     //     ),
    //     //     BufWriter::new(serial_port),
    //     // );

    //     match io::copy(&mut serial_port, &mut io::stdout().lock()) {
    //         Ok(bytes_copies) => info!("Transferred {} bytes", bytes_copies),
    //         Err(e) => match e.kind() {
    //             io::ErrorKind::TimedOut => {
    //                 error!("Failed to connect to the serial port");

    //                 return Ok(());
    //             }
    //             io::ErrorKind::BrokenPipe => {
    //                 if args.reconnect {
    //                     warn!("Serial port disconnected!");

    //                     thread::sleep(Duration::from_millis(1000));

    //                     info!("Attempting to reconnect...");

    //                     is_reconnecting = true;

    //                     continue;
    //                 } else {
    //                     error!("Serial port disconnected!");

    //                     return Ok(());
    //                 }
    //             }
    //             _ => Err(e).wrap_err("Failed to write from the serial port to stdout")?,
    //         },
    //     };
    // }
}

fn setup_logger(verbose: usize) -> Result<(), SetLoggerError> {
    let application_verbosity = match verbose {
        0 => LevelFilter::Info,
        1 => LevelFilter::Debug,
        _ => LevelFilter::Trace,
    };

    let library_verbosity = match verbose {
        0..=2 => LevelFilter::Warn,
        3 => LevelFilter::Info,
        4 => LevelFilter::Debug,
        _ => LevelFilter::Trace,
    };

    CombinedLogger::init(vec![
        TermLogger::new(
            application_verbosity,
            ConfigBuilder::new()
                .add_filter_allow_str(module_path!())
                .build(),
            TerminalMode::Mixed,
        ),
        TermLogger::new(
            library_verbosity,
            ConfigBuilder::new()
                .add_filter_ignore_str(module_path!())
                .build(),
            TerminalMode::Mixed,
        ),
    ])?;

    debug!(
        "using application verbosity: {} | using library verbosity: {}",
        application_verbosity, library_verbosity
    );

    Ok(())
}
