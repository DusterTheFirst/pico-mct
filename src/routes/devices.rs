use std::{collections::BTreeMap, time::Duration};

use anyhow::anyhow;
use async_std::task;
use crossfire::mpsc::unbounded_future;
use log::{debug, error, info};
use serde::Deserialize;
use tide::{sse::Sender, Body, Request, StatusCode};

use crate::{serial::get_serial_ports, State};

use super::super::ingest::ingest;

pub async fn list_devices(_: Request<State>) -> tide::Result<Body> {
    let serial_ports = get_serial_ports()
        .await?
        .map(|port| (port.name, port.product))
        .collect::<BTreeMap<_, _>>();

    Body::from_json(&serial_ports)
}

#[derive(Deserialize)]
struct DeviceConnectQuery {
    port: String,
    timeout: Option<u64>,
    baud: Option<u32>,
}

pub async fn device_connect(req: Request<State>, sender: Sender) -> tide::Result<()> {
    let DeviceConnectQuery {
        port: port_name,
        timeout,
        baud,
    } = req.query()?;

    if port_name.is_empty() {
        return Err(tide::Error::new(
            StatusCode::BadRequest,
            anyhow!("device {} does not exist", port_name),
        ));
    }

    // FIXME: not 1s for timeout?
    // Assuming Pico SDK USB CDC so baud rate does not matter
    match serialport::new(&port_name, baud.unwrap_or(0))
        .timeout(Duration::from_millis(timeout.unwrap_or(1000)))
        .open()
    {
        Ok(new_port) => {
            info!("Connected to device {}", port_name);

            let (tx, rx) = unbounded_future();

            let ingest_task = task::spawn_blocking(move || ingest(tx, new_port));

            loop {
                let packet = match rx.recv().await {
                    Ok(packet) => packet,
                    Err(_) => {
                        error!("Failed to get a packet from the ingest thread");
                        break;
                    }
                };

                match sender
                    .send("telemetry", serde_json::to_string(&packet)?, None)
                    .await
                {
                    Ok(()) => {}
                    Err(_) => {
                        info!("Client disconnected from event source");
                        break;
                    }
                }
            }

            debug!("Disconnecting from device {}", port_name);

            if let Some(res) = ingest_task.cancel().await {
                if let Err(err) = res {
                    error!("Ingest task encountered an error: {}", err);
                }
            }

            info!("Disconnected from device {}", port_name);

            Ok(())
        }
        Err(err) => {
            error!("Failed to open serial port {}: {}", port_name, err);

            Err(tide::Error::new(
                StatusCode::ServiceUnavailable,
                anyhow!("failed to open device {}", port_name),
            ))
        }
    }
}
