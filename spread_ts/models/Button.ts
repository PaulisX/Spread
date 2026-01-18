import { Cell } from "./Cell";

export class Button {
	id: number;
	memberOf: number;
	spreadsTo: number | undefined;
	neighbors: Uint16Array;
	state: ButtonState;
	constructor(
		id: number,
		state: ButtonState,
		memberOf: number,
		spreadsTo: number | undefined = undefined,
		neighbors: Uint16Array
	) {
		this.id = id;
		this.memberOf = memberOf;
		this.spreadsTo = spreadsTo;
		this.neighbors = neighbors;
		this.state = state;
	}
}
const BUTTON_STATES = ["disabled", "free", "taken"] as const;
export type ButtonState = (typeof BUTTON_STATES)[number];
