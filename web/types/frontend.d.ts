import { TelemetryPacket } from "./generated/ingest";

declare interface PortControlElements {
    port_list_container: HTMLUListElement;
    indicator: SimpleIndicator;
    disconnect_button: HTMLButtonElement;
    connect_button: HTMLButtonElement;
    dismiss(): void;
}

declare type RealtimeTelemetrySubscribers = {
    [A in keyof TelemetryPacket]?: Set<(data: TelemetryDatum) => void>;
};
