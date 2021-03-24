import { namespace, telemetry_type } from "./constants.js"

/** @returns {OpenMCTPlugin} */
export function PicoPilotPlugin() {
    return (openmct) => {
        // console.log("I've ben installed!");

        openmct.objects.addRoot({
            namespace,
            key: "avionics"
        });

        openmct.objects.addProvider(namespace, objectProvider);

        openmct.types.addType(telemetry_type, {
            name: 'Example Telemetry Point',
            description: 'Example telemetry point from our happy tutorial.',
            cssClass: 'icon-telemetry'
        });

        openmct.composition.addProvider(compositionProvider);
    }
}

const objectProvider = {
    get: async (identifier) => {
        if (identifier.key === "avionics") {
            return {
                identifier,
                name: "Pico Pilot",
                type: "folder",
                location: "ROOT"
            }
        } else {
            return {
                identifier,
                name: `Pico Pilot (${identifier.key})`,
                type: telemetry_type,
                location: `${namespace}:avionics`
            }
        }

    }
};

const compositionProvider = {
    appliesTo: (object) => {
        return object.identifier.namespace === namespace && object.type === "folder";
    },
    load: async () => {
        return [{
            namespace,
            key: 1
        }]
    }
};
