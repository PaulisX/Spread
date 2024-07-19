import { ClientMessageTypes, ServerMessageTypes } from "./MessageTypes";
import { GameBoard } from "./Models/Game";
import { ClientData } from "./Networking/Models/ClientData";
import { Message } from "./Networking/Models/Message";
import { peerJsServer } from "./Networking/PeerJsServer";
import { Server } from "./Networking/Server";
import { TypedEventEmitter } from "./Utils/TypedEventEmitter";
import EventEmitter from "eventemitter3";

export class GameServer {
	gameBoard: GameBoard | null = null;

	server: Server | null = null;
	started: boolean = false;
	errored: boolean = false;

	currentTurn: number = 0;
	turnCount: number = 0;
	turnOrder: ClientData[] = [];

	events: EventEmitter = new EventEmitter();

	constructor() {}
	getId(): string {
		if (this.server == null) throw new Error("server is null");
		return this.server!.id;
	}
	waitForEvent<T>(emitter: TypedEventEmitter<any>, event: string): Promise<T> {
		return new Promise((resolve, reject) => {
			emitter.once(event, resolve);
			emitter.once("error", reject);
		});
	}
	async startServer() {
		this.server = new peerJsServer();
		// TODO: Handle server cration fail
		await this.waitForEvent(this.server.events, "started");

		this.server.events.on("error", (err: Error) => {
			this.errored = true;
		});
		this.server.events.on("onDisconnected", (client) => {
			console.log(`Player ${client.id}, ${client.username} left.`);
			let index = this.turnOrder.findIndex((v) => v.id == client.id);
			this.turnOrder.splice(index, 1);
			this.gameBoard?.cells.forEach((x) => {
				x.forEach((cell) => {
					if (cell.owner != client.id) return;
					cell.clear();
				});
			});

			this.server?.sendMessageAll({
				type: ServerMessageTypes.PlayerLeftLobby,
				content: JSON.stringify(client),
			});
		});
		this.server.events.on("onMessage", (msg: Message, client: ClientData) => {
			this.handleServerMessage(msg, client);
		});
		this.server.events.on("onConnected", (client) => {
			console.log("Client connected ", client.username);
			this.turnOrder.push(client);
			this.server!.sendMessageAllExcept(
				{
					type: ServerMessageTypes.PlayerJoinedLobby,
					content: JSON.stringify(client),
				},
				client.id
			);
		});
		this.server.events.on("onDisconnected", () => {});

		this.started = true;
	}
	getScores(): Map<number, number> {
		let score: Map<number, number> = new Map();
		this.server!.getClients().forEach((v) => score.set(v.id, 0));
		this.gameBoard!.cells.forEach((row) => {
			row.forEach((cell) => {
				if (cell.owner == -1) return;
				score.set(cell.owner, score.get(cell.owner)! + 1);
			});
		});
		return score;
	}
	handleServerMessage(msg: Message, client: ClientData) {
		switch (msg.type) {
			case ClientMessageTypes.GetLobbyMemberList:
				this.server!.sendMessage(
					{
						type: ServerMessageTypes.LobbyMemberList,
						content: JSON.stringify(this.server!.getClients()),
					},
					client.id
				);
				break;
			case ClientMessageTypes.StartGame: {
				//TODO: implement check for rights to start game
				this.gameBoard = new GameBoard();
				this.gameBoard.initGame(5);
				this.server!.sendMessageAll({
					type: ServerMessageTypes.StartGame,
					content: JSON.stringify({
						size: 5,
						nextTurn: this.turnOrder[this.currentTurn]!.id,
					}),
				});
				this.turnOrder = this.server!.getClients();
				console.log("Turn order: ", this.turnOrder);
				break;
			}
			case ClientMessageTypes.HoverBtn: {
				if (this.gameBoard == null) {
					console.warn(
						"Client tried to perform turn with null game board. message, clientId: ",
						msg,
						client.id
					);
					break;
				}
				if (this.turnOrder[this.currentTurn]!.id != client.id) {
					break;
				}
				this.server!.sendMessageAllExcept(
					{
						type: ServerMessageTypes.HoverBtn,
						content: msg.content,
					},
					client.id
				);
				break;
			}
			case ClientMessageTypes.PerformTurn: {
				let el: number[] = JSON.parse(msg.content);
				el.push(client.id);
				if (this.gameBoard == null) {
					console.warn(
						"Client tried to perform turn with null game board. message, clientId: ",
						msg,
						client.id
					);
					break;
				}
				if (client.id != this.turnOrder[this.currentTurn]!.id) {
					console.warn(
						"Client tried to perform outside their turn: ",
						this.currentTurn,
						client.id,
						this.turnOrder
					);
					break;
				}
				if (!this.gameBoard.move(client.id, el[0]!, el[1]!, el[2]!)) {
					console.warn("illegal move", el);
					break;
				}
				let i = 0;
				let scores: Map<number, number> = this.getScores();
				let gameEnd = false;
				while (this.gameBoard.updateQueue.length > 0) {
					this.gameBoard!.update();
					if (++i > 100) {
						console.error("Hit 100 iterations");
						break;
					}
					if (this.turnCount > this.currentTurn) {
						scores = this.getScores();
						let alivePlayers = 0;
						scores.forEach((v) => {
							if (v > 0) alivePlayers++;
						});
						if (alivePlayers <= 1) {
							gameEnd = true;
							break;
						}
					}
				}
				this.currentTurn = (this.currentTurn + 1) % this.turnOrder.length;
				this.turnCount++;
				this.server!.sendMessageAll({
					type: ServerMessageTypes.PerformTurn,
					content: JSON.stringify({
						move: el,
						score: scores,
						gameEnd: gameEnd,
						nextTurn: this.currentTurn,
					}),
				});

				if (gameEnd) {
					this.events.emit("gameOver");
				}
				break;
			}
			default:
				console.error("Unknown message!", msg);
				break;
		}
	}
	destroy() {
		this.server!.destroy();
	}
}
