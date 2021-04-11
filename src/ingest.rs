use std::{
    collections::BTreeMap,
    io::{self, BufReader},
    sync::Arc,
    time::{Duration, Instant},
};

use async_std::{sync::RwLock, task};
use crossfire::mpsc::TxUnbounded;
use lazy_static::lazy_static;
use log::{debug, error, info, trace, warn};
use serde_cbor::error::Category;
use serialport::SerialPort;

use crate::telemetry::TelemetryPacket;

lazy_static! {
    pub static ref TIMESCALE_DATA: Arc<RwLock<BTreeMap<u64, TelemetryPacket>>> =
        Arc::new(RwLock::new(BTreeMap::new()));
}

pub fn ingest(
    tx: TxUnbounded<TelemetryPacket>,
    serial_port: Box<dyn SerialPort>,
) -> io::Result<()> {
    // TODO: ENSURE ONLY ONE INGEST TASK AT A TIME
    task::block_on(TIMESCALE_DATA.write()).clear();

    let mut serial_port = BufReader::new(serial_port);

    let mut packets =
        serde_cbor::Deserializer::from_reader(&mut serial_port).into_iter::<TelemetryPacket>();

    let mut last_report = Instant::now();
    let mut packets_accumulator = 0;
    const SAMPLING_DURATION: Duration = Duration::from_secs(10);

    let mut seeking = true;

    for packet in &mut packets {
        match packet {
            Ok(packet) => {
                if seeking {
                    debug!("Found first packet");
                    seeking = false;
                }

                // Store the data in a timescale "db"
                task::block_on(TIMESCALE_DATA.write()).insert(packet.running_us, packet);

                if tx.send(packet).is_err() {
                    debug!("Transmit channel closed, shutting down");

                    break;
                }

                packets_accumulator += 1;
                if Instant::now().duration_since(last_report) > SAMPLING_DURATION {
                    trace!(
                        "Reading at {} p/s",
                        packets_accumulator as f64 / SAMPLING_DURATION.as_secs_f64()
                    );

                    packets_accumulator = 0;
                    last_report = Instant::now();
                }
            }
            Err(e) => {
                if seeking {
                    continue;
                }

                if e.is_scratch_too_small() {
                    error!("Scratch buffer was too small to hold incoming packet, skipping this packet.");
                    warn!("If this persists, the scratch buffer may need to be resized, or malformed packets may be being received");

                    continue;
                }

                match e.classify() {
                    Category::Io => {
                        error!("Encountered I/O error, closing device");
                        break;
                    }
                    Category::Syntax | Category::Data => {
                        warn!(
                            "Failed to parse packet at {}. Skipping... : {}",
                            e.offset(),
                            e
                        );
                    }
                    Category::Eof => {
                        info!("Reached EOF, closing device");

                        break;
                    }
                }
            }
        }
    }

    trace!("Ingest thread shut down");

    Ok(())
}
