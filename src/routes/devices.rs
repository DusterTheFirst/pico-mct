use std::{collections::BTreeMap, time::Duration};

use anyhow::anyhow;
use async_std::task;
use crossfire::mpsc::unbounded_future;
use log::{debug, error};
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
}

pub async fn device_connect(req: Request<State>, sender: Sender) -> tide::Result<()> {
    let DeviceConnectQuery { port: port_name } = req.query()?;

    if port_name.len() == 0 {
        return Err(tide::Error::new(
            StatusCode::BadRequest,
            anyhow!("device {} does not exist", port_name),
        ));
    }

    // TODO: not 1s for timeout?
    // Assuming Pico SDK USB CDC so baud rate does not matter

    match serialport::new(&port_name, 0)
        .timeout(Duration::from_secs(1))
        .open()
    {
        Ok(new_port) => {
            debug!("Connected to new serial port {}", port_name);

            let (tx, rx) = unbounded_future();

            // TODO:
            let ingest_task = task::spawn_blocking(move || ingest(tx, new_port));

            while let Ok(buf) = rx.recv().await {
                debug!("sending");
                sender.send("test", format!("{:?}", buf), None).await.expect("h?");
            }

            debug!("Disconnecting from device");

            ingest_task.cancel().await;

            debug!("Disconnected from device {}", port_name);

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
