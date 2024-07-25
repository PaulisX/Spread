import "./DevConsole.ts";
import { DevConsole } from "./DevConsole.js";
import { GameServer } from "./GameServer.js";
import { GameUI } from "./GameUI.js";
import { GameWorld } from "./GameWorld.js";
import { ClientMessageTypes, ServerMessageTypes } from "./MessageTypes.js";
import { GameBoard } from "./Models/Game.js";
import { GameSettings } from "./Models/GameSettings.js";
import { PerformedTurn } from "./Models/PerformedTurn.js";
import { Client } from "./Networking/Client.js";
import { ClientData } from "./Networking/Models/ClientData.js";
import { Message } from "./Networking/Models/Message.js";
import { peerJsClient } from "./Networking/PeerJsClient.js";
import "./Utils/Object3DExtensions.ts";

let gameServer: GameServer | null;
let client: Client;
let game: GameBoard | null;

let turnCount: number = 0;
let turnOrder: number[];
let members: Map<number, ClientData> = new Map<number, ClientData>();

let gameWorld = new GameWorld();
let boardModification: Promise<any>;

let gameUi = new GameUI();
gameUi.setWorldCanvas(gameWorld.getCanvas());
gameUi.events.on("host", (username: string) => Host(username));
gameUi.events.on("join", (joinCode: string, username: string) =>
	Join(joinCode, username)
);

function Join(hostId: string, username: string) {
	console.log("Joining ...");
	if (client == null) {
		client = new peerJsClient();
	}
	client.events.on("started", (id: string) => {
		client.connect(hostId, username);
	});
	client.events.on("onMessage", (msg: Message) => {
		handleClientMessage(msg);
	});
	client.events.on("onConnected", () => {
		console.log("Connected to server!");
		gameUi.showLobby(hostId);
		client.sendMessage({
			type: ClientMessageTypes.GetLobbyMemberList,
			content: "",
		});
	});

	// connectUI.style.display = "none";
	// lobbyUI.style.display = "block";
}
async function Host(username: string) {
	// TODO: Handle fail to start
	console.log("Starting server ...");
	gameServer = new GameServer();
	await gameServer.startServer();
	// if(!gameServer.started){
	//     console.error("Failed to start error!");
	//     return;
	// }

	console.log("Connecting to own server ...");
	Join(gameServer.getId(), username);
	gameServer.events.on("gameOver", () => {
		//TODO: Handle game over
		console.log("Server destroyed!");
		gameServer!.destroy();
	});
	// Set start game btn
	gameUi.events.on("startGame", () => {
		if (members.size < 2) {
			console.warn("Cannot start server with less than 2 players!");
			return;
		}
		console.log("Starting game ...");
		client.sendMessage({
			type: ClientMessageTypes.StartGame,
			content: "",
		});
	});

	gameUi.showLobby(gameServer.getId(), true);
}
async function handleClientMessage(msg: Message) {
	switch (msg.type) {
		case ServerMessageTypes.LobbyMemberList:
			members = new Map(
				Array.from(JSON.parse(msg.content)).map<[number, ClientData]>(
					(v: any) => {
						return [v.id, new ClientData(v.id, v.username)];
					}
				)
			);
			gameUi.setLobbyMemembers(members);
			break;
		case ServerMessageTypes.PlayerJoinedLobby:
			let newClient: ClientData = JSON.parse(msg.content);
			members.set(newClient.id, newClient);
			gameUi.setLobbyMemembers(members);
			break;
		case ServerMessageTypes.PlayerLeftLobby:
			let leftClient: ClientData = JSON.parse(msg.content);
			console.log(`Player ${leftClient.id}, ${leftClient.username} left.`);
			await boardModification;
			members.delete(leftClient.id);
			gameUi.setLobbyMemembers(members);
			gameUi.setGameMemberList(members);
			game?.clearCells((cell) => cell.owner == leftClient.id);
			gameWorld.createGameboard(game!, GameUI.colors);
			break;
		case ServerMessageTypes.StartGame:
			let m: GameSettings = JSON.parse(msg.content);
			let boardSize: number = m.boardSize;
			turnOrder = m.turnOrder;
			turnCount = 0;
			startGame();
			break;
		case ServerMessageTypes.HoverBtn:
			//TODO: Handle hover
			break;
		case ServerMessageTypes.PerformTurn: {
			let pt: PerformedTurn = JSON.parse(msg.content);
			// let gameOver: boolean = pt.resultScores.entries.length == 1;

			//TODO: change to assert
			if (pt.playerId != turnOrder[turnCount % turnOrder.length])
				throw new Error(
					`Not equals: ${pt.playerId}, ${
						turnOrder[turnCount % turnOrder.length]
					}`
				);

			if (!game?.move(pt.playerId, pt.cellX, pt.cellY, pt.side)) {
				//TODO: Handle Failed turn
				alert("Failed to performed remote turn!" + msg);
				console.error("Failed to performed remote turn!", msg);
				break;
			}
			console.log(
				"update queue not promise",
				JSON.stringify(game!.updateQueue)
			);
			game!.updateQueue.forEach((c) => {
				console.log("Test", c);
			});
			gameWorld.colorCell(
				pt.cellX,
				pt.cellY,
				pt.side,
				GameUI.colors[pt.playerId]!
			);
			let score: Map<number, number> = game.getScores();
			let explosionCount = 0;
			boardModification = new Promise<void>(async (resolve, reject) => {
				while (game!.updateQueue.length > 0 && score.size > 1) {
					gameUi.setExplosionCounter(
						++explosionCount,
						GameUI.colors[pt.playerId]
					);
					let updateQueue = [...game!.updateQueue];
					let changes = game!.update();
					await gameWorld.explodeCells(
						updateQueue,
						GameUI.colors[pt.playerId] ?? 0x000,
						changes
					);
					score = game!.getScores();
				}
				if (explosionCount > 0)
					gameUi.setExplosionCounter(0, GameUI.colors[pt.playerId]);

				if (score.entries.length == 1) {
					let id: number = score.keys().next().value!;
					let winner = members.get(score.keys().next().value!);
					if (winner == undefined)
						throw TypeError(`ClientData is undefined. ClientId: ${id}`);
					gameOverF(winner);
				}
				turnCount++;
				resolve();
			});
			await boardModification;
			break;
		}
		default:
			console.error("Unknown message!", msg);
			break;
	}
}

function gameOverF(winner: ClientData): void {
	//TODO: Handle game over client side
	console.log("Game over!");
	gameServer = null;
	gameUi.gameOver(winner);
}
function startGame(): void {
	console.log("Starting game ...");
	game = new GameBoard();
	game.initGame(5);

	gameWorld.createGameboard(game!, GameUI.colors);
	gameWorld.events.on("clickBtn", (out: number[]) => {
		// if(game?.cells[out[0]][out[1]].owner == currentTurn)
		// if(game?.cells[out[0]][out[1]].filedSides[out[2]] == 0)
		// 	return;
		client.sendMessage({
			type: ClientMessageTypes.PerformTurn,
			content: JSON.stringify(out),
		});
	});
	gameUi.showGame();
	gameUi.setGameMemberList(members);
}

updateFrame();
function updateFrame() {
	requestAnimationFrame(updateFrame);
	gameWorld.updateFrame();
	gameUi.updateFrame();
}

initDevFunctions();
function initDevFunctions() {
	DevConsole.addFunction(
		"Host",
		Host,
		"Start server and client",
		"username: string"
	);
	DevConsole.addFunction(
		"RegenBoard",
		() => {
			gameWorld.createGameboard(game!, GameUI.colors);
		},
		"Regenerates the game board"
	);
	DevConsole.addFunction(
		"PrintGame",
		() => {
			console.log(game);
			// gameWorld.createGameboard(game!, GameUI.colors);
		},
		"Returns the game"
	);
	DevConsole.addFunction(
		"PrintWorld",
		() => {
			console.log(gameWorld);
			// gameWorld.createGameboard(game!, GameUI.colors);
		},
		"Returns the game"
	);
}
