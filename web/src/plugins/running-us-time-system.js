/** @type {Set<(time: number) => void>} */
let tick_listeners = new Set();

let last_time = 0;

/** @param {number} time */
export function tick_clock(time) {
    last_time = time;
    tick_listeners.forEach((fn) => fn(time));
}

export function RunningUSTimeSystem() {
    return () => {
        openmct.time.addClock({
            currentValue() {
                return last_time;
            },
            description: "Clock following the us since uC boot",
            key: "uc_running_us",
            name: "us Clock",
            off(event, callback) {
                if (event === "tick") {
                    tick_listeners.delete(callback);
                } else {
                    console.warn(
                        "Something asked for a non 'tick' event from the clock"
                    );
                }
            },
            on(event, callback) {
                if (event === "tick") {
                    tick_listeners.add(callback);
                } else {
                    console.warn(
                        "Something asked for a non 'tick' event from the clock"
                    );
                }
            },
        });
        openmct.time.clock("uc_running_us", {
            start: -60 * 1000 * 1000,
            end: 0,
        });

        openmct.time.addTimeSystem({
            key: "uc_running_us",
            name: "Running Time (seconds)",
            timeFormat: "us_as_seconds",
        });
        openmct.time.timeSystem("uc_running_us", { end: 0, start: 0 });

        openmct.telemetry.addFormat({
            key: "us_as_seconds",
            format(value) {
                return (value / (1000 * 1000)).toFixed(4) + "s";
            },
            parse(text) {
                return parseFloat(text) * (1000 * 1000);
            },
            validate(text) {
                return isNaN(parseFloat(text.substring(0, text.length - 1)));
            },
        });
    };
}
