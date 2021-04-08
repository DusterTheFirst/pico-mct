import { namespace, telemetry_server, telemetry_type } from "../constants.js";

/** @returns {OpenMCTPlugin} */
export function PicoPilotPlugin() {
    return (openmct) => {
        // console.log("I've ben installed!");

        openmct.objects.addRoot({
            namespace,
            key: "avionics",
        });

        openmct.objects.addProvider(namespace, objectProvider);

        openmct.types.addType(telemetry_type, {
            name: "Example Telemetry Point",
            description: "Example telemetry point from our happy tutorial.",
            cssClass: "icon-telemetry",
        });

        openmct.composition.addProvider(compositionProvider);
    };
}

/** @type {Partial<ObjectProvider>} */
const objectProvider = {
    get: async (identifier) => {
        if (identifier.key === "avionics") {
            return {
                identifier,
                name: "Pico Pilot",
                type: "folder",
                location: "ROOT",
            };
        } else {
            let response = await fetch(`${telemetry_server}/measurements/${identifier.key}`);

            if (!response.ok) {
                return {
                    identifier,
                    name: "FAILED TO LOAD"
                }
            }

            return await response.json();

            // return {
            //     identifier,
            //     name: `Pico Pilot (${identifier.key})`,
            //     type: telemetry_type,
            //     location: `${namespace}:avionics`,
            //     telemetry: {
            //         values: []
            //     }
            // };
        }
    },
};

/** @type {CompositionProvider} */
const compositionProvider = {
    appliesTo: (object) => {
        return (
            object.identifier.namespace === namespace &&
            object.type === "folder"
        );
    },
    load: async (object) => {
        let response = await fetch(`${telemetry_server}/measurements`);

        if (!response.ok) {
            return [] // Show error?
        }

        return await response.json();
    }
};
