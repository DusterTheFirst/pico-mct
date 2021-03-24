import { telemetry_type } from "./constants.js";

/** @returns {OpenMCTPlugin} */
export function HistoricalTelemetryPlugin() {
    return (openmct) => {
        const provider = {
            supportsRequest: (domainObject) => domainObject.type === telemetry_type,
            request: (domainObject, options) => {
                // const url = '/history/' +
                //     domainObject.identifier.key +
                //     '?start=' + options.start +
                //     '&end=' + options.end;

                // return http.get(url)
                //     .then(function (resp) {
                //         return resp.data;
                //     });
                // TODO:
            }
        };

        openmct.telemetry.addProvider(provider);
    }
}