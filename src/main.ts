import "./DevConsole.ts";
import { DevConsole } from "./DevConsole.ts";
import { GameServer } from "./GameServer";
import { GameUI } from "./GameUI.ts";
import { GameWorld } from "./GameWorld.ts";
import { ClientMessageTypes, ServerMessageTypes } from "./MessageTypes.ts";
import { GameBoard } from "./Models/Game";
import { Client } from "./Networking/Client.ts";
import { ClientData } from "./Networking/Models/ClientData.ts";
import { Message } from "./Networking/Models/Message";
import { peerJsClient } from "./Networking/PeerJsClient.ts";
import "./Utils/Object3DExtensions.ts";

let gameServer: GameServer | null;
let client: Client;
let game: GameBoard | null;

let members: ClientData[] = [];
let currentTurn: number = 0;

let gameWorld = new GameWorld();
let boardModification: Promise<any>;

let gameUi = new GameUI();
gameUi.setWorldCanvas(gameWorld.getCanvas());
gameUi.events.on("host", (username: string) => Host(username));
gameUi.events.on("join", (joinCode: string, username: string) =>
	Join(joinCode, username)
);

function Join(hostId: string, username: string) {
	console.log(`join code: ${hostId}, username: ${username}`);
	console.log("Joining ...");
	if (client == null) {
		console.log("create client!");
		client = new peerJsClient();
	}
	client.events.on("started", (id: string) => {
		console.log("started, Connecting ...", id);
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

	console.log("Joining game ...");
	Join(gameServer.getId(), username);
	gameServer.events.on("gameOver", () => {
		console.log("Server destroyed!");
		gameServer!.destroy();
	});
	// Set start game btn
	gameUi.events.on("startGame", () => {
		if (members.length < 2) {
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
function getAlivePlayerCount() {
	let scores = getScores();
	let count = 0;
	scores.forEach((val) => {
		if (val > 0) count++;
	});
	return count;
}
function getScores(): Map<number, number> {
	let score: Map<number, number> = new Map<number, number>();
	members.forEach((v) => score.set(v.id, 0));
	game!.cells.forEach((row) => {
		row.forEach((cell) => {
			if (cell.owner == -1) return;
			score.set(cell.owner, score.get(cell.owner)! + 1);
		});
	});
	return score;
}
async function handleClientMessage(msg: Message) {
	switch (msg.type) {
		case ServerMessageTypes.LobbyMemberList:
			members = JSON.parse(msg.content);
			console.log("Members list: ", members);
			gameUi.setLobbyMemembers(members);
			break;
		case ServerMessageTypes.PlayerJoinedLobby:
			let newClient: ClientData = JSON.parse(msg.content);
			members.push(newClient);
			gameUi.setLobbyMemembers(members);
			break;
		case ServerMessageTypes.PlayerLeftLobby:
			let leftClient: ClientData = JSON.parse(msg.content);
			console.log(`Player ${leftClient.id}, ${leftClient.username} left.`);
			await boardModification;
			members = members.filter((v) => v.id != leftClient.id);
			console.log(members);
			gameUi.setLobbyMemembers(members);
			gameUi.setGameMemberList(members);
			game?.clearCells((cell) => cell.owner == leftClient.id);
			gameWorld.createGameboard(game!, GameUI.colors);
			break;
		case ServerMessageTypes.StartGame:
			let m = JSON.parse(msg.content);
			let boardSize: number = m.size;
			let nextTurn: number = m.nextTurn;
			startGame();
			currentTurn = nextTurn;
			break;
		case ServerMessageTypes.HoverBtn:
			//TODO: Handle hover
			break;
		case ServerMessageTypes.PerformTurn: {
			let m = JSON.parse(msg.content);
			let move: number[] = m.move;
			let gameOver: boolean = m.gameEnd;
			let serverScore: Map<number, number> = m.score;
			let nextTurn: number = m.nextTurn;
			console.log(currentTurn, move[3], nextTurn);
			if (move.length != 4) {
				console.error("");
				return;
			}

			console.log("client handle turn", move[0], move[1]);
			if (!game?.move(move[3]!, move[0]!, move[1]!, move[2]!)) {
				//TODO: Handle Failed turn
				alert("Failed to performed remote turn!" + msg);
				console.error("Failed to performed remote turn!", msg);
				break;
			}

			gameWorld.colorCell(
				move[0]!,
				move[1]!,
				move[2]!,
				GameUI.colors[move[3]!]!
			);
			let score: Map<number, number>;
			let explosionCount = 0;
			boardModification = new Promise<void>(async (resolve, reject) => {
				while (game!.updateQueue.length > 0 && getAlivePlayerCount()) {
					let updateQueue: number[][] = Object.assign(
						[],
						game!.updateQueue
					);
					let changes = game!.update();
					gameUi.setExplosionCounter(
						++explosionCount,
						GameUI.colors[move[3]!]
					);
					await gameWorld.explodeCells(
						updateQueue,
						changes,
						GameUI.colors[move[3]!]
					);
					console.log("exploded!!!");
					if (getAlivePlayerCount() <= 1) break;
				}
				if (explosionCount > 0)
					gameUi.setExplosionCounter(0, GameUI.colors[move[3]!]);
				if (gameOver) {
					score = getScores();
					for (let k of score.keys()) {
						if (score.get(k)! > 0) {
							let winner = members.find((v) => {
								if (v.id == k) return v;
							});
							if (!winner)
								throw new Error(`Failed to find winner! id: ${k}`);
							gameOverF(winner);
							break;
						}
					}
				}
				currentTurn = nextTurn;
				resolve();
			});
			await boardModification;

			//                                                      HIGHLIGHTS  currnet player
			// document
			// 	.getElementById(`g-pid-${currentTurn}`)
			// 	?.classList.remove("current-turn");
			// document
			// 	.getElementById(`g-pid-${nextTurn}`)
			// 	?.classList.add("current-turn");

			break;
		}
		default:
			console.error("Unknown message!", msg);
			break;
	}
}

function gameOverF(winner: ClientData): void {
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
	requestAnimationFrame(updateFrame.bind(this));
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
}
