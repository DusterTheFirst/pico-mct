use std::iter;

use color_eyre::{eyre::Context, Result};
use dialoguer::{theme::ColorfulTheme, Select};
use phf::phf_map;
use serialport::{SerialPortType, UsbPortInfo};

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

#[derive(Debug, Clone, Copy)]
pub struct PicoProduct {
    pub company: &'static str,
    pub description: &'static str,
    pub link: &'static str,
}

#[derive(Debug, Clone)]
pub struct USBSerialPort {
    pub name: String,
    pub product: Option<&'static PicoProduct>,
    pub info: UsbPortInfo,
}

pub fn select_serial_port_prompt() -> Result<Option<USBSerialPort>> {
    Ok(loop {
        let serial_ports = serialport::available_ports()
            .wrap_err("Failed to get a listing of the serial ports")?
            .into_iter()
            .filter_map(|port| match port.port_type {
                SerialPortType::UsbPort(info) => {
                    if info.vid == PICO_USB_VID {
                        Some(USBSerialPort {
                            name: port.port_name,
                            product: PICO_USB_PID_MAP.get(&info.pid),
                            info,
                        })
                    } else {
                        None
                    }
                }
                _ => None,
            })
            .collect::<Box<_>>();

        let serial_port_selection = serial_ports
            .iter()
            .map(|port| {
                if let Some(product) = port.product {
                    return format!("{} | {} <{}>", port.name, product.description, product.link);
                } else {
                    return format!("{} | Unknown PID ({})", port.name, port.info.pid);
                }
            })
            .chain(iter::once("Refresh".into()))
            .collect::<Box<_>>();

        let selection = Select::with_theme(&ColorfulTheme::default())
            .items(&serial_port_selection)
            .default(0)
            .interact_opt()
            .wrap_err("Failed to get valid user input")?;

        match selection {
            Some(index) if index < serial_ports.len() => {
                break Some(serial_ports[index].clone());
            }
            Some(_) => continue,
            None => {
                break None;
            }
        }
    })
}
