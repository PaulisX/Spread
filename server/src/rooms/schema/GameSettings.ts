import { ArraySchema, Schema, type } from "@colyseus/schema";

export class GameSettings extends Schema {
    @type("uint8") width: number = 5;
    @type("uint8") height: number = 5;
    @type([ "string" ]) turnOrder = new ArraySchema<string>();
}