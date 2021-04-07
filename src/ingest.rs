use std::{
    convert::TryInto,
    io::{self, BufReader, Read},
    mem::size_of,
    ops::RangeFrom,
    sync::Once,
};

use crossfire::mpsc::TxUnbounded;
use log::{debug, error, trace, warn};
use serde::Serialize;
use serialport::SerialPort;
use ts_rs::{export, TS};

#[derive(Debug, Serialize, TS)]
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

    const PACKET_SIZE: usize = size_of::<u16>()
        + size_of::<u64>()
        + size_of::<f64>() * 6
        + size_of::<u16>()
        + size_of::<u64>();
    let mut buf = [0; PACKET_SIZE];

    const MAGIC_NUMBER: u64 = 0xDEADBEEFBEEFDEAD;
    const MAGIC_NUMBER_BYTES: [u8; 8] = MAGIC_NUMBER.to_le_bytes();

    const MAGIC_NUMBER_BYTE_RANGE: RangeFrom<usize> = PACKET_SIZE - MAGIC_NUMBER_BYTES.len()..;

    loop {
        serial_port.read_exact(&mut buf)?;

        {
            let announce_once = Once::new();

            let mut shifted_bytes = 0;

            while buf[MAGIC_NUMBER_BYTE_RANGE] != MAGIC_NUMBER_BYTES {
                announce_once.call_once(|| {
                    warn!("Lost lock on telemetry signal, seeking...");
                });

                buf.rotate_left(1);

                let last_range = buf.len() - 1..;

                serial_port.read_exact(&mut buf[last_range])?;

                // dbg!(buf);
                // dbg!(MAGIC_NUMBER_BYTES);

                // stdin().read_line(&mut String::new())?;

                shifted_bytes += 1;
            }

            if shifted_bytes != 0 {
                debug!("Seeking {} bytes", shifted_bytes);
            }
        }

        let in_crc = u16::from_le_bytes(buf[0..2].try_into().unwrap());
        let calc_crc = crczoo::crc16_ccitt_false(&buf[2..]);

        if in_crc != calc_crc {
            error!("CRC Failed, {:x} != {:x}", in_crc, calc_crc);

            continue;
        }

        let packet = TelemetryPacket {
            running_us: u64::from_le_bytes(buf[2..10].try_into().unwrap()),
            tvc_x: f64::from_le_bytes(buf[10..18].try_into().unwrap()),
            tvc_z: f64::from_le_bytes(buf[18..26].try_into().unwrap()),
            angle: f64::from_le_bytes(buf[26..34].try_into().unwrap()),
            temperature: f64::from_le_bytes(buf[34..42].try_into().unwrap()),
            v_sys: f64::from_le_bytes(buf[42..50].try_into().unwrap()),
            v_bat: f64::from_le_bytes(buf[50..58].try_into().unwrap()),
            offset: u16::from_le_bytes(buf[58..60].try_into().unwrap()),
        };

        if tx.send(packet).is_err() {
            debug!("Transmit channel closed, shutting down");

            break;
        }
    }

    trace!("Ingest thread shut down");

    Ok(())
}
