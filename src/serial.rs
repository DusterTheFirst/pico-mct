use phf::phf_map;

// https://github.com/raspberrypi/usb-pid#assignment
pub const PICO_USB_VID: u16 = 0x2E8A;
pub const PICO_USB_PID_MAP: phf::Map<u16, PicoProduct<'static>> = phf_map! {
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
pub struct PicoProduct<'a> {
    pub company: &'a str,
    pub description: &'a str,
    pub link: &'a str,
}
