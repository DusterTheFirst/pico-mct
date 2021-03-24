window.onload = () => {
    openmct.setAssetPath("./openmct/");
    openmct.install(openmct.plugins.LocalStorage());
    openmct.install(openmct.plugins.MyItems());
    openmct.install(openmct.plugins.UTCTimeSystem());
    openmct.time.clock("local", { start: -15 * 60 * 1000, end: 0 });
    openmct.time.timeSystem("utc");
    openmct.install(openmct.plugins.Espresso());

    openmct.install(PicoPilotPlugin());

    openmct.start();
};

const namespace = "dusterthefirst.pico-pilot";


function PicoPilotPlugin() {
    return (openmct) => {
        // console.log("I've ben installed!");

        openmct.objects.addRoot({
            namespace,
            key: "avionics"
        });

        openmct.objects.addProvider(namespace, objectProvider);

        openmct.types.addType(`${namespace}.telemetry`, {
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
                type: `${namespace}.telemetry`,
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