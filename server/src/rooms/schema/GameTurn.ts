import { Schema, type } from "@colyseus/schema";

export class GameTurn extends Schema {
    @type("uint16") buttonId: number = 0;
    @type("string") playerId: string = "";
}