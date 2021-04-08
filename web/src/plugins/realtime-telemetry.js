import { telemetry_type } from "../constants.js";

/** @returns {OpenMCTPlugin} */
function RealtimeTelemetryPlugin() {
    return (openmct) => {
        openmct.telemetry.addProvider({
            supportsSubscribe(domainObject) {
                return domainObject.type == telemetry_type;
            },
            subscribe(domainObject, callback) {
                return () => {};
            },
        });
    };
}
