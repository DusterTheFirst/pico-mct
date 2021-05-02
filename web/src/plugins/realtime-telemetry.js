import { telemetry_type } from "../constants.js";
import { tick_clock } from "./running-us-time-system.js";

/** @returns {OpenMCTPlugin} */
export function RealtimeTelemetryPlugin() {
    return (openmct) => {
        openmct.telemetry.addProvider({
            supportsSubscribe(domainObject) {
                return domainObject.type == telemetry_type;
            },
            subscribe(domainObject, callback) {
                let key = /** @type {keyof TelemetryPacket} */ (domainObject
                    .identifier.key);

                let existing_subscribers = subscribers[key];

                if (existing_subscribers === undefined) {
                    existing_subscribers = new Set();
                }

                existing_subscribers.add(callback);

                subscribers[key] = existing_subscribers;

                return () => {
                    subscribers[key]?.delete(callback);
                };
            },
        });
    };
}

/** @type {RealtimeTelemetrySubscribers} */
let subscribers = {};

/**
 * @param {TelemetryPacket} packet
 */
export function push_telemetry(packet) {
    tick_clock(packet.running_us);

    for (const x in packet) {
        const key = /** @type {keyof TelemetryPacket} */ (x);

        let subscriptions = subscribers[key];

        if (subscriptions !== undefined) {
            subscriptions.forEach((fn) => {
                fn({
                    id: key,
                    value: packet[key],
                    running_us: packet.running_us,
                });
            });
        }
    }
}
