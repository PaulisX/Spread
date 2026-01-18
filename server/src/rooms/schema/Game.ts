import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";
import { Player } from "./Player";
import { GameSettings } from "./GameSettings";
import { GameTurn } from "./GameTurn";

export class GameSchema extends Schema {
	@type("string") gameId: string = "";
	@type("boolean") started: boolean = false;
	@type({ map: Player }) players: MapSchema<Player> = new MapSchema<Player>();
	@type("uint8") size: number = 8;
	@type("string") gameLeader: string = "";
	@type(GameSettings) gameSettings = new GameSettings();
	@type({array: GameTurn}) turnHistory = new ArraySchema<GameTurn>();
}