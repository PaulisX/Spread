import { TypedEventEmitter } from "../Utils/TypedEventEmitter";
import { ClientData } from "./Models/ClientData";
import { Message } from "./Models/Message";

export type Server = {
	id: string;
	events: TypedEventEmitter<ServerEvents>;
	isAlive(): boolean;
	disconnect(id: number): void;

	sendMessage(message: Message, id: number): void;
	sendMessageAll(message: Message): void;
	sendMessageAllExcept(message: Message, ...id: number[]): void;

	getClient(id: number): ClientData | undefined;
	getClients(): ClientData[];

	destroy(): void;
};
export type ServerEvents = {
	started: [id: string];
	onMessage: [message: Message, client: ClientData];
	onConnected: [client: ClientData];
	onDisconnected: [client: ClientData];
	error: [error: Error];
};
