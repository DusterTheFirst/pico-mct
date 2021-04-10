use std::{
    io::{self, BufReader},
    time::{Duration, Instant},
};

use crossfire::mpsc::TxUnbounded;
use log::{debug, trace, warn};
use serde::{Deserialize, Serialize};
use serialport::SerialPort;
use ts_rs::{export, TS};

#[derive(Debug, Serialize, Deserialize, TS)]
pub struct TelemetryPacket {
    running_us: u64,
    tvc_x: f64,
    tvc_z: f64,
    angle: f64,
    temperature: f64,
    v_sys: f64,
    v_bat: f64,
    offset: u16,
}

export! {
    TelemetryPacket => "./web/types/generated/ingest.d.ts"
}

pub fn ingest(
    tx: TxUnbounded<TelemetryPacket>,
    serial_port: Box<dyn SerialPort>,
) -> io::Result<()> {
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

                warn!("Failed to parse packet. Skipping... : {}", e);
            }
        }
    }

    trace!("Ingest thread shut down");

    Ok(())
}
