import { PicoPilotPlugin } from "./pico-pilot-plugin.js";
import { HistoricalTelemetryPlugin } from "./historical-telemetry-plugin.js";
import { telemetry_server } from "./constants.js";

/**
 * @param {HTMLUListElement} container 
 */
async function refresh(container) {
    let response = await fetch(`${telemetry_server}/config/devices`);

    if (response.ok) {
        /** @type {PortListing} */
        let listing = await response.json();

        container.textContent = "";

        for (let port in listing) {
            let info = listing[port];

            // Should never happen, but just to appease the type checker
            if (info === undefined) {
                continue;
            }

            const port_container = document.createElement("li");

            const port_button = document.createElement("button");
            port_button.textContent = port;
            port_button.addEventListener("click", async () => {
                let response = await fetch(`${telemetry_server}/config/devices/connect`, { body: port, method: "POST" });

                if (response.ok) {
                    alert("TODO: Success");
                } else {
                    alert("TODO: Failure");
                }
            })
            port_container.appendChild(port_button);

            const port_info = document.createElement("a");
            if (info !== null) {
                port_info.textContent = info.description;
                port_info.href = info.link;
            } else {
                port_info.innerText = "Unknown";
            }
            port_container.appendChild(port_info);

            container.appendChild(port_container);
        }
    } else {
        alert("TODO: Failure");
    }
}

window.onload = async () => {
    const container = document.createElement("div");

    const list_container = document.createElement("ul");
    container.appendChild(list_container);

    const refresh_button = document.createElement("button");
    refresh_button.addEventListener("click", () => refresh(list_container));
    refresh_button.innerText = "Refresh";

    container.appendChild(refresh_button);

    document.body.appendChild(container);
    refresh(list_container);

    let sse = new EventSource(`${telemetry_server}/events`, { withCredentials: false });

    sse.addEventListener("open", () => console.log("POG"));
    sse.addEventListener("test", (event) => console.log("recv", event.data));

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