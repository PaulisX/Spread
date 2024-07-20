import Peer from "peerjs";
import type { DataConnection, PeerError, PeerErrorType } from "peerjs";
import { TypedEventEmitter } from "../Utils/TypedEventEmitter";
import { Server, ServerEvents } from "./Server";
import { ClientData } from "./Models/ClientData";
import { Message } from "./Models/Message";

export class peerJsServer implements Server {
	readonly events: TypedEventEmitter<ServerEvents> =
		new TypedEventEmitter<ServerEvents>();

	public id: string = "";
	protected peer: Peer;
	protected clients: Map<number, PeerJsClientData> = new Map<
		number,
		PeerJsClientData
	>();
	protected maxClients: number = 10;

	constructor() {
		this.peer = new Peer();
		this.peer.on("open", (id) => {
			this.id = id;
			console.log("My peer ID is: " + id);
			this.events.emit("started", id);
		});
		this.peer.on("error", (err: PeerError<any>) => {
			this.peer.destroy();
			this.events.emit("error", err);
		});
		this.peer.on("connection", (dataConnection) => {
			const newId = this.getFreeId();
			if (newId == -1) dataConnection.close();
			const newClient = new PeerJsClientData(
				newId,
				dataConnection.metadata as string,
				dataConnection.peer,
				dataConnection.connectionId
			);
			console.log(
				"Client connected!",
				newId,
				dataConnection.connectionId,
				newClient.username
			);
			this.clients.set(newId, newClient);

			dataConnection.on("close", () => {
				console.log("connection close", newClient);
				this.clients.delete(newClient.id);
				this.events.emit("onDisconnected", newClient);
			});
			dataConnection.on("data", (data: any) => {
				this.events.emit("onMessage", data as Message, newClient);
			});
			this.events.emit("onConnected", newClient);
		});
	}
	isAlive(): boolean {
		if (!this.peer) return false;
		return this.peer.open;
	}
	disconnect(id: number): void {
		const connection = this.getDataConnection(id);
		if (connection == null)
			throw RangeError(`connection for client ${id} does not exist`);
		connection.close();
	}
	sendMessage(message: Message, id: number): void {
		const connection = this.getDataConnection(id);
		if (connection == null)
			throw RangeError(`connection for client ${id} does not exist`);
		connection.send(message);
	}
	sendMessageAllExcept(message: Message, ...id: number[]): void {
		this.clients.forEach((client) => {
			if (id.some((x) => x === client.id)) return;
			const connection = this.getDataConnection(client.id);
			if (connection == null)
				throw RangeError(
					`connection for client ${client.id} does not exist`
				);
			connection.send(message);
		});
	}
	// sendMessageMultiple(message: Message, ...ids: number[]): void{
	//     ids.forEach(id => {
	//         const connection = this.getDataConnection(id);
	//         if(connection == null)
	//             throw RangeError(`connection for client ${id} does not exist`);
	//         connection.send(message)
	//     });
	// };
	sendMessageAll(message: Message): void {
		this.clients.forEach((client) => {
			const connection = this.getDataConnection(client.id);
			if (connection == null)
				throw RangeError(
					`connection for client ${client.id} does not exist`
				);
			connection.send(message);
		});
	}

	// getClient(id: number): ClientData|undefined;
	// getClient(connectionId: string): ClientData|undefined;
	getClientById(id: number): PeerJsClientData | undefined {
		return this.clients.get(id);
	}
	getClientByConnectionId(id: string): PeerJsClientData | undefined {
		for (let element of this.clients.values()) {
			if (element[1].connectionId == id) {
				return element[1];
			}
		}
		return undefined;
	}
	getClients(): ClientData[] {
		return Array.from(this.clients.values());
	}
	private getFreeId(): number {
		for (let i: number = 0; i < this.maxClients; i++) {
			if (!this.clients.has(i)) {
				return i;
			}
		}
		return -1;
	}

	private getDataConnection(id: number): DataConnection | null {
		const clientData = this.clients.get(id);
		if (clientData === undefined) return null;

		const connection = this.peer.getConnection(
			clientData.peerId,
			clientData.connectionId
		);
		return connection as DataConnection;
	}
	destroy(): void {
		this.peer.destroy();
	}
}
class PeerJsClientData implements ClientData {
	constructor(
		id: number,
		username: string,
		peerId: string,
		connectionId: string
	) {
		this.id = id;
		this.username = username;
		this.peerId = peerId;
		this.connectionId = connectionId;
	}
	id: number;
	username: string;
	peerId: string;
	connectionId: string;
}
