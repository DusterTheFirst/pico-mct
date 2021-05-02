use std::collections::BTreeMap;

use async_std::task;
use phf::phf_map;
use serde::Serialize;
use serialport::{SerialPortType, UsbPortInfo};
use ts_rs::{export, TS};

// https://github.com/raspberrypi/usb-pid#assignment
pub const PICO_USB_VID: u16 = 0x2E8A;
pub static PICO_USB_PID_MAP: phf::Map<u16, PicoProduct> = phf_map! {
    // Internal
    0x0003u16 => PicoProduct { company: "Raspberry Pi", description: "Raspberry Pi RP2040 boot", link: "https://www.raspberrypi.org/documentation/pico/getting-started/" },
    0x0004u16 => PicoProduct { company: "Raspberry Pi", description: "Raspberry Pi PicoProbe", link: "https://github.com/raspberrypi/picoprobe/" },
    0x0005u16 => PicoProduct { company: "Raspberry Pi", description: "Raspberry Pi Pico MicroPython firmware (CDC)", link: "https://micropython.org/download/rp2-pico/" },
    0x000Au16 => PicoProduct { company: "Raspberry Pi", description: "Raspberry Pi Pico SDK CDC UART", link: "https://raspberrypi.github.io/pico-sdk-doxygen/index.html" },
    0x000Bu16 => PicoProduct { company: "Raspberry Pi", description: "Raspberry Pi Pico CircuitPython firmware", link: "https://circuitpython.org/board/raspberry_pi_pico/" },
    // Commercial
    // 0x1000 - 0x1fff
    // 0x1000 Reserved 1
    0x1001u16 => PicoProduct { company: "Pimoroni", description: "Picade 2040", link: "http://pimoroni.com/picade2040" },
};

#[derive(Debug, Clone, Copy, Serialize, TS)]
pub struct PicoProduct {
    pub company: &'static str,
    pub description: &'static str,
    pub link: &'static str,
}

#[derive(Debug, Serialize, TS)]
struct PortListing(BTreeMap<String, Option<PicoProduct>>);

#[derive(Debug, Clone)]
pub struct UsbSerialPort {
    pub name: String,
    pub product: Option<&'static PicoProduct>,
    pub info: UsbPortInfo,
}

export! {
    (declare) PicoProduct, PortListing => "./web/types/generated/serial.d.ts"
}

pub async fn get_serial_ports() -> serialport::Result<impl Iterator<Item = UsbSerialPort>> {
    Ok(task::spawn_blocking(serialport::available_ports)
        .await?
        .into_iter()
        .filter_map(|port| match port.port_type {
            SerialPortType::UsbPort(info) => {
                if info.vid == PICO_USB_VID {
                    Some(UsbSerialPort {
                        name: port.port_name,
                        product: PICO_USB_PID_MAP.get(&info.pid),
                        info,
                    })
                } else {
                    None
                }
            }
            _ => None,
        }))
}
