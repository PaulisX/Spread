import { Schema, type } from "@colyseus/schema";

export class PlayerStats extends Schema {
	@type("uint8") currentCells: number = 0;
	@type("uint8") maxCombo: number = 0;
	@type("uint8") maxCells: number = 0;
	@type("uint8") eliminatedBy: number = 0;
}
