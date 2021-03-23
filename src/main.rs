use anyhow::Context;
use clap::AppSettings::ColoredHelp;
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
    pub port: Option<String>, // FIXME: no utf8 parsing needed?
    /// Automatically reconnect if the port disconnects
    #[structopt(short, long)]
    pub reconnect: bool,
}

fn main() -> anyhow::Result<()> {
    let args = CommandLineArguments::from_args();

    setup_logger(args.verbose).context("Failed to initialize logger")?;

    if let Some(port) = args.port {
        todo!();
    } else {
        println!("No serial port provided, select one from below");

        let serial_ports = serialport::available_ports()
            .context("Failed to get a listing of the serial ports")?
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
            .collect::<Vec<_>>();

        let selection = Select::with_theme(&ColorfulTheme::default())
            .items(&serial_port_selection)
            .default(0)
            .interact_opt()
            .context("Failed to get valid user input")?;

        match selection {
            Some(index) => println!("User selected item : {:?}", serial_ports[index]),
            None => println!("User did not select anything"),
        }
    }

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
