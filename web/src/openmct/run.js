import { HistoricalTelemetryPlugin } from "./plugin/historical-telemetry.js";
import { PicoPilotPlugin } from "./plugin/pico-pilot.js";

export function start_openmct() {
    openmct.setAssetPath("./openmct/");
    openmct.install(openmct.plugins.LocalStorage());
    openmct.install(openmct.plugins.MyItems());
    openmct.install(openmct.plugins.UTCTimeSystem());
    openmct.time.clock("local", { start: -15 * 60 * 1000, end: 0 });
    openmct.time.timeSystem("utc");
    openmct.install(openmct.plugins.Espresso());

    openmct.install(PicoPilotPlugin());
    openmct.install(HistoricalTelemetryPlugin());

    const test = openmct.indicators.simpleIndicator(); // TODO: USE
    test.statusClass("icon-tabular-lad-set");
    test.text("Test");
    openmct.indicators.add(test);

    const overlay = openmct.overlays.overlay({
        buttons: [
            {
                label: "Return",
                callback() {
                    overlay.dismiss();
                },
            },
            {
                label: "Refresh",
                callback() {},
            },
        ],
        element: (() => {
            const button = document.createElement("ul");
            button.innerText = "Hellow";
            return button;
        })(),
        onDestroy() {},
        size: "fit",
        dismissable: false, // sic
    });

    openmct.start();
}
