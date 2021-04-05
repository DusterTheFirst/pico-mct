use std::{io};

use crossfire::mpsc::TxUnbounded;
use log::debug;
use serialport::SerialPort;

pub fn ingest(tx: TxUnbounded<Vec<u8>>, mut serial_port: Box<dyn SerialPort>) -> io::Result<()> {
    let mut buf = vec![0; 100];

    loop {
        debug!("ingesting");

        serial_port.read_exact(&mut buf[0..100])?;

        if let Err(_) = tx.send(buf.clone()) {
            return Ok(());
        }
    }
}
