// import { get } from "http";
import type { Board } from "../models/Board";
import { Button } from "../models/Button";
import { Cell } from "../models/Cell";
export class Game {
	board: Board;
	fullCells: Cell[];
	turnCounter;
	constructor(
		board: Board,
		fullCells: Cell[] = [],
		turnCounter = 0
	) {
		this.board = board;
		this.fullCells = fullCells;
		this.turnCounter = turnCounter;
	}
	selectButton(buttonId: number, player: string): boolean {
		// NOT Already selected
		let button = this.board.buttons[buttonId];
		if (!button || button.state !== "free") return false;
		// Parrent cell NOT owned by another player
		let cell = this.board.cells[button.memberOf];
		if (!cell) return false;
		if (cell.takenBy!==undefined && cell.takenBy !== "" && cell.takenBy !== player) return false;

		this.turnCounter++;
		// Select cell
		button.state = "taken";
		cell.takenBy = player;

		// Update full cells list
		if (this.cellFull(cell)) this.fullCells.push(cell);

		return true;
	}
	canSelectButton(buttonId: number, player: string): boolean{
		// NOT Already selected
		let button = this.board.buttons[buttonId];
		if (!button || button.state !== "free") return false;
		// Parrent cell owned by another player
		let cell = this.board.cells[button.memberOf];
		if (!cell) return false;
		if (cell.takenBy!==undefined && cell.takenBy !== "" && cell.takenBy !== player) return false;
		// is ok
		return true;
	}
	explodeCells(): boolean {
		const newFullCells: Cell[] = [];
		this.fullCells.forEach((cell) => {
			cell.buttons.forEach((btnId) => {
				let btn = this.board.buttons[btnId];
				if(!btn) return;
				if (btn.state == "disabled") return;
				btn.state = "free";
			});
		});
		this.fullCells.forEach((cell) => {
			cell.buttons.forEach((btnId) => {
				let btn = this.board.buttons[btnId];
				if (!btn) return;
				if (btn.state == "disabled" || !btn.spreadsTo) return;
				let nextBtn = this.findButtonToSpreadTo(
					this.board.buttons[btn.spreadsTo]!
				);
				if (!nextBtn) return;

				nextBtn.state = "taken";
				const nextCell = this.board.cells[nextBtn.memberOf]!;

				nextCell.takenBy = cell.takenBy;
				if(this.cellFull(nextCell)) newFullCells.push(nextCell);
			});
			if(this.cellEmpty(cell))
				cell.takenBy = undefined;
		});
		this.fullCells = newFullCells;
		return this.fullCells.length>0;
	}
	findButtonToSpreadTo(btn: Button): Button | undefined {
		let visited: number[] = [];
		let queue: Button[] = [];
		queue.push(btn);
		while (queue[0]) {
			let btn: Button = queue.shift()!;

			if (btn.state === "free") return btn;
			visited.push(btn.id);

			btn.neighbors.forEach((neighborId) => {
				if (visited.find((id) => id === neighborId)) return;
				let neighbor = this.board.buttons[neighborId]!;
				queue.push(neighbor);
			});
		}
		return undefined;
	}
	cellFull(cell: Cell): boolean {
		return cell.buttons.every(
			(btnId) => this.board.buttons[btnId]?.state !== "free"
		);
	}
	cellEmpty(cell: Cell): boolean {
		return cell.buttons.some(
			(btnId) => this.board.buttons[btnId]?.state !== "taken"
		);
	}
	isGameOver():boolean{
		return this.getWinner!=undefined;
	}
	getWinner():string|undefined{
		if(this.turnCounter<2) return undefined
		let firstPlayerAlive: string|undefined = undefined;
		for(const cell of this.board.cells){
			if(cell.takenBy){
				if(!firstPlayerAlive)
					firstPlayerAlive = cell.takenBy;
				else if(firstPlayerAlive != cell.takenBy) {
					return undefined;
				}
			}
		}
		return firstPlayerAlive;
	}
}
