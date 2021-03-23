use std::{
    io::{self, BufReader, BufWriter},
    iter,
    time::Duration,
};

use clap::AppSettings::ColoredHelp;
use color_eyre::{eyre::Context, Help};
use dialoguer::{theme::ColorfulTheme, Select};
use log::{debug, error, info, trace, warn, LevelFilter, SetLoggerError};
use serial::{PICO_USB_PID_MAP, PICO_USB_VID};
use serialport::SerialPortType;
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
    pub reconnect: bool,
}

fn main() -> color_eyre::Result<()> {
    color_eyre::install()?;

    let args = CommandLineArguments::from_args();

    setup_logger(args.verbose).wrap_err("Failed to initialize logger")?;

    let serial_port = if let Some(port) = args.port {
        port
    } else {
        println!("No serial port provided, select one from below");

        loop {
            let serial_ports = serialport::available_ports()
                .wrap_err("Failed to get a listing of the serial ports")?
                .into_iter()
                .filter_map(|port| match port.port_type {
                    SerialPortType::UsbPort(info) => {
                        if info.vid == PICO_USB_VID {
                            Some((port.port_name, PICO_USB_PID_MAP.get(&info.pid), info))
                        } else {
                            None
                        }
                    }
                    _ => None,
                })
                .collect::<Vec<_>>();

            let serial_port_selection = serial_ports
                .iter()
                .map(|(name, product, info)| {
                    if let Some(product) = product {
                        return format!("{} | {} <{}>", name, product.description, product.link);
                    } else {
                        return format!("{} | Unknown PID ({})", name, info.pid);
                    }
                })
                .chain(iter::once("Refresh".into()))
                .collect::<Vec<_>>();

            let selection = Select::with_theme(&ColorfulTheme::default())
                .items(&serial_port_selection)
                .default(0)
                .interact_opt()
                .wrap_err("Failed to get valid user input")?;

            match selection {
                Some(index) if index < serial_ports.len() => {
                    println!("User selected item: {:?}", serial_ports[index]);

                    break serial_ports[index].0.clone();
                }
                Some(_) => continue,
                None => {
                    println!("User did not select any port");

                    return Ok(());
                }
            }
        }
    };

    let mut serial_port = serialport::new(&serial_port, args.baud)
        .timeout(Duration::from_millis(1000)) // FIXME:
        .open()
        .wrap_err_with(|| format!("Failed to open port {}", serial_port))?;

    // let (mut serial_port_read, mut serial_port_write) = (
    //     BufReader::new(
    //         serial_port
    //             .try_clone()
    //             .wrap_err("Failed to clone the open serial port")?,
    //     ),
    //     BufWriter::new(serial_port),
    // );

    io::copy(&mut serial_port, &mut io::stdout().lock())
        .context("Failed to write from the serial port to stdout")?;

    Ok(())
}

fn setup_logger(verbose: usize) -> Result<(), SetLoggerError> {
    let application_verbosity = match verbose {
        0 => LevelFilter::Warn,
        1 => LevelFilter::Info,
        2 => LevelFilter::Debug,
        _ => LevelFilter::Trace,
    };

    let library_verbosity = match verbose {
        0..=3 => LevelFilter::Warn,
        4 => LevelFilter::Info,
        5 => LevelFilter::Debug,
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

    info!(
        "using application verbosity: {} | using library verbosity: {}",
        application_verbosity, library_verbosity
    );

    Ok(())
}
