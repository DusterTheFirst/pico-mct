use std::sync::mpsc::Receiver;

use serialport::SerialPort;

// pub fn ingest_main(rx: Receiver<Option<Box<dyn SerialPort>>>) {
//     let mut serial_port = None;

//     loop {
//         if let Some(serial_port) = rx.try_recv() {

//         } else {
//             serial_port = None;
//             continue;
//         }
//     }
// }

// pub fn ingest_data() {

// }