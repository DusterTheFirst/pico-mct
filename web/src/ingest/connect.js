/**
 * @interface EventSourceEventMap
 */

import { telemetry_server } from "../constants.js";

let refresh_abort_controller = new AbortController();

/**
 * @param {PortControlElements} elements
 */
export async function refresh_port_listing(elements) {
    let { port_list_container, refresh_button } = elements;

    refresh_button.innerText = "Refresh";

    // Abort all previous requests
    refresh_abort_controller.abort();

    if (event_source !== undefined) {
        event_source.close();
        event_source = undefined;
    }

    // Make a new abort controller for this request
    refresh_abort_controller = new AbortController();

    let loading_display = setTimeout(() => {
        port_list_container.textContent = "Loading...";
    }, 1000);

    let response;

    try {
        response = await fetch(`${telemetry_server}/devices`, {
            signal: refresh_abort_controller.signal,
        });
    } catch (e) {
        if (e instanceof DOMException && e.code === DOMException.ABORT_ERR) {
            // Return early without modifying dom if aborted
            return;
        }
    }

    if (response !== undefined && response.ok) {
        /** @type {import("../../types/generated/serial.js").PortListing} */
        let listing = await response.json();

        clearTimeout(loading_display);
        port_list_container.textContent = "";

        for (let port in listing) {
            let info = listing[port];

            // Should never happen, but just to appease the type checker
            if (info === undefined) {
                continue;
            }

            const port_container = document.createElement("li");

            const port_button = document.createElement("button");
            port_button.textContent = port;
            port_button.addEventListener("click", () => {
                port_container.style.listStyleType = "disclosure-closed"; // TODO: Disable all buttons
                refresh_button.textContent = "Disconnect";

                let buttons =
                    /** @type {HTMLButtonElement[] | undefined} */
                    (port_button.parentElement?.parentElement?.querySelectorAll(
                        "li > button"
                    ));

                if (buttons !== undefined) {
                    for (let button of buttons) {
                        button.disabled = true;
                    }
                }

                subscribe_to_events(port, elements);
            });
            port_container.appendChild(port_button);

            const port_info = document.createElement("a");
            if (info !== null) {
                port_info.textContent = info.description;
                port_info.href = info.link;
            } else {
                port_info.innerText = "Unknown";
            }
            port_container.appendChild(port_info);

            port_list_container.appendChild(port_container);
        }

        return true;
    } else {
        clearTimeout(loading_display);
        port_list_container.textContent = "";

        const error_container = document.createElement("div");
        error_container.textContent = `Failed to connect to ${telemetry_server}. Is the server running?`;

        port_list_container.appendChild(error_container);

        return false;
    }
}

/** @type {EventSource | undefined} */
let event_source;

/**
 * @param {string} port
 * @param {PortControlElements} elements
 */
export function subscribe_to_events(port, elements) {
    try {
        event_source = new EventSource(
            `${telemetry_server}/devices/connect?port=${encodeURIComponent(
                port
            )}`
        );
    } catch (e) {
        alert("TODO: Failure");
    }

    if (event_source !== undefined) {
        const sse = event_source;

        // sse.addEventListener("open", () => console.log("POG"));
        sse.addEventListener("telemetry", (event) => {
            /** @type {import("../../types/generated/ingest.js").TelemetryPacket}  */
            const packet = JSON.parse(event.data);

            console.log("recv", packet);
        });

        sse.addEventListener("error", () => {
            sse.close();

            refresh_port_listing(elements);
        });
    }
}
