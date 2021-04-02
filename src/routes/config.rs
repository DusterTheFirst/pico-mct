use std::{collections::BTreeMap, time::Duration};

use log::{debug, error, info};
use tide::{Body, Request, Response, StatusCode};

use crate::{serial::get_serial_ports, State};

pub async fn list_devices(_: Request<State>) -> tide::Result<Body> {
    let serial_ports = get_serial_ports()
        .await?
        .map(|port| (port.name, port.product))
        .collect::<BTreeMap<_, _>>();

    Body::from_json(&serial_ports)
}

pub async fn device_connect(mut req: Request<State>) -> tide::Result<Response> {
    let new_port_name = req.body_string().await?;

    if new_port_name.len() == 0 {
        return Ok(Response::new(StatusCode::BadRequest));
    }

    // TODO: not 1s for timeout?
    // Assuming Pico SDK USB CDC so baud rate does not matter
    Ok(
        match serialport::new(&new_port_name, 0)
            .timeout(Duration::from_secs(1))
            .open()
        {
            Ok(new_port) => {
                let mut current_port = req.state().lock().await;

                *current_port = Some(new_port);
                debug!("Connected to new serial port", { name: new_port_name });

                Response::new(StatusCode::Accepted)
            }
            Err(err) => {
                error!("Failed to open serial port", {
                    port: new_port_name,
                    error: err.to_string()
                });

                Response::new(StatusCode::ServiceUnavailable)
            }
        },
    )
}

pub async fn device_disconnect(req: Request<State>) -> tide::Result<Response> {
    *req.state().lock().await = None;

    Ok(Response::new(StatusCode::Ok))
}
