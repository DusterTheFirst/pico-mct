use std::io;

use crossfire::mpsc::TxUnbounded;
use log::{debug, trace};
use serde::Serialize;
use serialport::SerialPort;
use ts_rs::{TS, export};

#[derive(Debug, Serialize, TS)]
pub struct TelemetryPacket(Vec<u8>);

export! {
    TelemetryPacket => "./web/types/generated/ingest.d.ts"
}

pub fn ingest(tx: TxUnbounded<Vec<u8>>, mut serial_port: Box<dyn SerialPort>) -> io::Result<()> {
    let mut buf = vec![0; 100];

    loop {
        serial_port.read_exact(&mut buf[0..100])?;

        if tx.send(buf.clone()).is_err() {
            debug!("Transmit channel closed, shutting down");

            break;
        }
    }

    trace!("Ingest thread shut down");

    Ok(())
}
