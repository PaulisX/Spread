import { CellButtonValue } from "./CellButtonValue.js";

export class Cell {
	owner: number = -1;
	buttons: CellButtonValue[];
	x: number;
	y: number;
	constructor(size: number, x: number, y: number) {
		this.buttons = new Array(size).fill(false, 0, size);
		this.x = x;
		this.y = y;
	}
	disableSide(side: number) {
		this.buttons[side] = CellButtonValue.Disabled;
	}

	enableSide(side: number) {
		this.buttons[side] = 0;
	}
	value(): number {
		let c = 0;
		this.buttons.forEach((e: number) => {
			if (e == 1) c++;
		});
		return c;
	}
	maxValue(): number {
		return this.buttons.length;
	}
	color(side: number, strict: boolean = true): boolean {
		if (this.buttons[side] == CellButtonValue.Disabled) return false;

		if (this.buttons[side] == CellButtonValue.Avaliable) {
			this.buttons[side] = CellButtonValue.Occupied;
			return true;
		}

		// Dont color another side if strict
		if (strict) return false;

		// Button already colored. color different side.
		for (let i = 0; i < this.buttons.length; i++) {
			if (this.buttons[i] != CellButtonValue.Avaliable) continue;
			this.buttons[i] = CellButtonValue.Occupied;
			break;
		}
		return true;
	}
	clear() {
		this.owner = -1;
		for (let i = 0; i < this.buttons.length; i++) {
			if (this.buttons[i] == CellButtonValue.Disabled) continue;
			this.buttons[i] = CellButtonValue.Avaliable;
		}
	}
	isFull(): boolean {
		for (let i = 0; i < this.buttons.length; i++) {
			if (this.buttons[i] == CellButtonValue.Avaliable) {
				return false;
			}
		}
		return true;
	}
}
