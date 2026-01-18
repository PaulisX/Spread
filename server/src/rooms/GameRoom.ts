import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";
import { Room, Client } from "@colyseus/core";
import { GameSchema } from "./schema/Game";
import { Player } from "./schema/Player";
import {
	CLIENT_MESSAGES,
	ClientMessage,
	SERVER_MESSAGES,
	ServerMessage,
	ClientMessagePayload
} from "./messages/SpreadMessages";
import { onTypedMessage,  } from "../utils/room/onTypedMessage";
import { sendTyped } from "../utils/room/sendTyped";
import { GameTurn } from "./schema/GameTurn";
import { Game } from "../../../spread_ts/logic/game";
import { squareBoard } from "../../../spread_ts/logic/boards"
const colorList: string[] = ['#EB5E55','#ebaa55','#e1eb55','#96eb55','#55eb5f','#19d785','#55e1eb','#5596eb','#5f55eb','#aa55eb','#eb55e1','#eb5596']
export class GameRoom extends Room<GameSchema> {
	maxClients = 8;
	game: Game|undefined = undefined;
	onCreate(options: any) {
		this.state = new GameSchema();
		this.state.size = 8;
		onTypedMessage<ClientMessage>(
			this,
			"request_board",
			(client, message) => {
				sendTyped<ServerMessage>(client, "board", "");
			}
		);
		onTypedMessage<ClientMessage, ClientMessagePayload["select_button"]>(
			this,
			"select_button",
			(client, message) => {
				if(!this.game) return;
				if(!this.game.selectButton(message.buttonId, client.sessionId)) return;
				while(this.game.fullCells.some(_=>true)){
					this.game.explodeCells();
				}
				const turn  =new GameTurn();
				turn.playerId = client.sessionId;
				turn.buttonId = message.buttonId;
				this.state.turnHistory.push(turn);
				console.log(this.game.getWinner());
				if(this.game.isGameOver()){
					console.log("Game over")
					this.state.started = false;
				}
			}
		);
		onTypedMessage<ClientMessage>(this,"set_board_width",(client,message) =>{
			this.state.gameSettings.width=message.value;
		});
		onTypedMessage<ClientMessage>(this,"set_board_height",(client,message) =>{
			this.state.gameSettings.height=message.value;
		});
		onTypedMessage<ClientMessage>(this, "start_game", (client, message) => {
			if (client.sessionId != this.state.gameLeader) return;
			this.state.gameId = crypto.randomUUID();
			this.state.started = true;
			this.state.turnHistory = new ArraySchema<GameTurn>();
			this.game = new Game(squareBoard(this.state.gameSettings.width, this.state.gameSettings.height));
		});
		onTypedMessage<ClientMessage>(this,"set_player_color",(client,message)=>{
			const player = this.state.players.get(client.sessionId);
			if(player) player.color = message.value;
		})
	}

	onJoin(client: Client, options: any) {
		if (this.clients.length > this.maxClients)
			throw new Error("Room is full!");
		if (typeof options.name !== "string") throw new Error("Missing name");

		let playerId = client.sessionId;

		client.userData = {};
		const newPlayer = new Player(playerId, options.name);
		newPlayer.color = this.firstFreeColor();//"#EB5E55";//this.randomHexColor();
		this.state.players.set(playerId, newPlayer);
		if(this.state.gameLeader=="") this.state.gameLeader = playerId;
		this.state.gameSettings.turnOrder.push(playerId);
		console.log(client.sessionId, "joined!");
	}

	onLeave(client: Client, consented: boolean) {
		const itemIndex = this.state.gameSettings.turnOrder.findIndex((v) => v === client.sessionId);
		this.state.gameSettings.turnOrder.splice(itemIndex,1);
		this.state.players.delete(client.sessionId);
		console.log(client.sessionId, "left!");
	}

	onDispose() {
		console.log("room", this.roomId, "disposing...");
	}
	firstFreeColor(): string {
		return colorList.find((col)=>!([...this.state.players.values()].some((p)=>p.color==col)))
	}
}
