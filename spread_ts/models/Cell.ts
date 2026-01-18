import { Button } from "./Button";
import { Player } from "../../server/src/rooms/schema/Player";

export class Cell {
	id: number;
	buttons: Uint16Array;
	takenBy: string | undefined = undefined;
	constructor(id: number, buttons?: Uint16Array, takenBy: string|undefined=undefined ) {
		this.id = id;
		if(buttons)
			this.buttons = buttons;
		else 
			this.buttons = new Uint16Array(0);
		
		this.takenBy = takenBy;

	}
}
