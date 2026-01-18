import { Schema, type } from "@colyseus/schema";
import { PlayerStats } from "./PlayerStats";

export class Player extends Schema {
	@type("string") id: string = "";
	@type("string") name: string = "Player";
	@type("string") color: string = "#000000";
	constructor(id: string, name: string) {
		super();
		this.id = id;
		this.name = name;
	}
}
