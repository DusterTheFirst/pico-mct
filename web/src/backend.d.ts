declare interface PortListing {
    [port_name: string]: PicoProduct | null;
}

declare interface PicoProduct {
    company: string;
    description: string;
    link: string;
}

interface EventSourceEventMap {
    "test": MessageEvent<string>
}