import { telemetry_type } from "../constants.js";

/** @returns {OpenMCTPlugin} */
export function HistoricalTelemetryPlugin() {
    return (openmct) => {
        openmct.telemetry.addProvider({
            supportsRequest: (domainObject) =>
                domainObject.type === telemetry_type,
            request: async (domainObject, options) => {
                // const url = '/history/' +
                //     domainObject.identifier.key +
                //     '?start=' + options.start +
                //     '&end=' + options.end;

                // return http.get(url)
                //     .then(function (resp) {
                //         return resp.data;
                //     });
                // TODO:

                return [];
            },
        });
    };
}
