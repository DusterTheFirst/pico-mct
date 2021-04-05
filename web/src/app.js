import { PicoPilotPlugin } from "./pico-pilot-plugin.js";
import { HistoricalTelemetryPlugin } from "./historical-telemetry-plugin.js";
import { telemetry_server } from "./constants.js";

/**
 * @typedef PortControlElements
 * @property {HTMLUListElement} port_list_container
 * @property {HTMLButtonElement} refresh_button
 */

let refresh_abort_controller = new AbortController();

/**
 * @param {PortControlElements} elements
 */
async function refresh_port_listing(elements) {
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
        response = await fetch(`${telemetry_server}/devices`, { signal: refresh_abort_controller.signal });
    } catch (e) {
        if (e instanceof DOMException && e.code === DOMException.ABORT_ERR) {
            // Return early without modifying dom if aborted
            return;
        }
    }

    if (response !== undefined && response.ok) {
        /** @type {PortListing} */
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

                let buttons = /** @type {HTMLButtonElement[] | undefined} */
                    (port_button.parentElement?.parentElement?.querySelectorAll("li > button"));

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
function subscribe_to_events(port, elements) {
    try {
        event_source = new EventSource(`${telemetry_server}/devices/connect?port=${encodeURIComponent(port)}`);
    } catch (e) {
        alert("TODO: Failure");
    }

    if (event_source !== undefined) {
        const sse = event_source;

        sse.addEventListener("open", () => console.log("POG"));
        sse.addEventListener("test", (event) => console.log("recv", event.data));

        sse.addEventListener("error", () => {
            sse.close();

            // TODO: Detect disconnect?

            refresh_port_listing(elements);
        });
    }
}

window.onload = async () => {
    const container = document.createElement("div");

    const port_list_container = document.createElement("ul");
    container.appendChild(port_list_container);

    const refresh_button = document.createElement("button");
    refresh_button.addEventListener("click", async () => await refresh_port_listing({ port_list_container, refresh_button }));
    refresh_button.innerText = "Refresh";

    container.appendChild(refresh_button);

    document.body.appendChild(container);

    await refresh_port_listing({ refresh_button, port_list_container });

    // openmct.setAssetPath("./openmct/");
    // openmct.install(openmct.plugins.LocalStorage());
    // openmct.install(openmct.plugins.MyItems());
    // openmct.install(openmct.plugins.UTCTimeSystem());
    // openmct.time.clock("local", { start: -15 * 60 * 1000, end: 0 });
    // openmct.time.timeSystem("utc");
    // openmct.install(openmct.plugins.Espresso());

    // openmct.install(PicoPilotPlugin());

    // openmct.start();
};