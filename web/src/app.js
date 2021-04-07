import { refresh_port_listing } from "./ingest/connect.js";
import { start_openmct } from "./openmct/run.js";

/**
 * @param {string} selectors
 */
HTMLElement.prototype.querySelectorAlways = function (selectors) {
    let result = this.querySelector(selectors);

    if (result === null) {
        throw new ReferenceError(`Element \`${selectors}\` missing`);
    }

    return result;
};

window.onload = async () => {
    start_openmct();

    const controls_container = document.getElementById("controls");

    if (controls_container === null) {
        throw new ReferenceError("Missing #controls div. Cannot proceed");
    }

    /** @type {HTMLUListElement} */
    const port_list_container = controls_container.querySelectorAlways(
        "#controls > ul.port_list"
    );

    /** @type {HTMLButtonElement} */
    const refresh_button = controls_container.querySelectorAlways(
        "#controls > button.refresh"
    );
    refresh_button.addEventListener(
        "click",
        async () =>
            await refresh_port_listing({ port_list_container, refresh_button })
    );

    await refresh_port_listing({ refresh_button, port_list_container });

    /** @type {HTMLButtonElement} */
    const start_button = controls_container.querySelectorAlways(
        "#controls > button.start"
    );
    start_button.addEventListener("click", () => {
        
        controls_container.hidden = true;
    })
};
