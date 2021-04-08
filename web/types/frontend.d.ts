declare interface PortControlElements {
    port_list_container: HTMLUListElement;
    indicator: SimpleIndicator;
    disconnect_button: HTMLButtonElement;
    connect_button: HTMLButtonElement;
    dismiss(): void;
}
