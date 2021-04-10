import { telemetry_server, telemetry_type } from "../constants.js";

/** @returns {OpenMCTPlugin} */
export function HistoricalTelemetryPlugin() {
    return (openmct) => {
        openmct.telemetry.addProvider({
            supportsRequest: (domainObject) =>
                domainObject.type === telemetry_type,
            request: async (domainObject, options) => {
                console.dir({ a: "oops", domainObject, options });
                // const url = '/history/' +
                //     domainObject.identifier.key +
                //     '?start=' + options.start +
                //     '&end=' + options.end;

                // return http.get(url)
                //     .then(function (resp) {
                //         return resp.data;
                //     });
                // TODO:

                const response = await fetch(
                    `${telemetry_server}/history/${domainObject.identifier.key}?start=${options.start}&end=${options.end}`
                );

                if (response.ok) {
                    const json = await response.json();
                    console.dir(json);
                    return json;
                } else {
                    console.error(
                        `Failed to get telemetry history, Server returned: ${response.status}: ${response.statusText}`
                    );
                    return [];
                }
            },
        });
    };
}
