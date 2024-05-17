import { TypedEventEmitter } from "../Utils/TypedEventEmitter"
import { Message } from "./Models/Message";

export type Client = {
    id: string|undefined,
    events :TypedEventEmitter<ClientEvents>,
    isConnected(): boolean;
    connect(serverCode:string, username?: string): void,
    disconnect(): void,
    sendMessage(message: Message): void,
}
export type ClientEvents = {
    'started': [id:string]
    'onMessage': [message: Message]
    'onConnected': []
    'onDisconnected': [expected: boolean]
}
