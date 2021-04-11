import { telemetry_server, telemetry_type } from "../constants.js";

/** @returns {OpenMCTPlugin} */
export function HistoricalTelemetryPlugin() {
    return (openmct) => {
        openmct.telemetry.addProvider({
            supportsRequest: (domainObject) =>
                domainObject.type === telemetry_type,
            request: async (domainObject, options) => {
                const response = await fetch(
                    `${telemetry_server}/history/${domainObject.identifier.key}?start=${options.start}&end=${options.end}`
                );

                if (response.ok) {
                    /** @type {TelemetryDatum[]} */
                    const json = await response.json();

                    console.dir(json.length);

                    return json;
                } else {
                    openmct.notifications.error(
                        `Failed to get telemetry history, Server returned: ${response.status}: ${response.statusText}`,
                        { autoDismissTimeout: 10000 }
                    );
                    return [];
                }
            },
        });
    };
}
