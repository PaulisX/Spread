export class GameBoard {
	cells: Cell[][] = [];
	updateQueue: Cell[];
	constructor() {
		this.updateQueue = [];
	}
	initGame(boardSize: number) {
		this.cells = new Array(boardSize);
		for (let i = 0; i < boardSize; i++) {
			this.cells[i] = new Array(boardSize);
		}
		for (let i = 1; i < boardSize - 1; i++) {
			for (let j = 1; j < boardSize - 1; j++) {
				this.cells[i]![j] = new Cell(4, i, j);
			}
		}
		for (let i = 1; i < boardSize - 1; i++) {
			this.cells[i]![0] = new Cell(4, i, 0);
			this.cells[i]![0]!.disableSide(0);
			this.cells[i]![boardSize - 1] = new Cell(4, i, boardSize - 1);
			this.cells[i]![boardSize - 1]!.disableSide(2);
			this.cells[0]![i] = new Cell(4, 0, i);
			this.cells[0]![i]!.disableSide(3);
			this.cells[boardSize - 1]![i] = new Cell(4, boardSize - 1, i);
			this.cells[boardSize - 1]![i]!.disableSide(1);
		}
		this.cells[0]![0] = new Cell(4, 0, 0);
		this.cells[0]![0].disableSide(0);
		this.cells[0]![0].disableSide(3);
		this.cells[0]![boardSize - 1] = new Cell(4, 0, boardSize - 1);
		this.cells[0]![boardSize - 1]!.disableSide(2);
		this.cells[0]![boardSize - 1]!.disableSide(3);
		this.cells[boardSize - 1]![0]! = new Cell(4, boardSize - 1, 0);
		this.cells[boardSize - 1]![0]!.disableSide(0);
		this.cells[boardSize - 1]![0]!.disableSide(1);
		this.cells[boardSize - 1]![boardSize - 1] = new Cell(
			4,
			boardSize - 1,
			boardSize - 1
		);
		this.cells[boardSize - 1]![boardSize - 1]!.disableSide(1);
		this.cells[boardSize - 1]![boardSize - 1]!.disableSide(2);
	}
	setBoard(gameBoard: Cell[][]) {
		this.cells = gameBoard;
	}
	getBoard(): Cell[][] {
		return this.cells;
	}
	getBoardWidth(): number {
		return this.cells.length;
	}
	getBoardLength(): number {
		return this.cells[0]!.length;
	}
	move(owner: number, x: number, y: number, side: number): boolean {
		const cell = this.cells[x]?.[y];
		if (!cell) {
			console.warn("Tried to perfrom move on illegal cell!");
			return false;
		}
		if (cell.owner != owner && cell.owner != -1) {
			console.log(cell, owner);
			return false;
		}

		if (!cell.color(side)) return false;

		cell.owner = owner;
		if (cell.isFull()) this.updateQueue.push(cell);
		return true;
	}
	update(): Cell[] {
		let newQ: Cell[] = [];
		// let exploded:number[][] = [];

		console.log(this.updateQueue);
		let changes: Cell[] = [];
		while (this.updateQueue.length > 0) {
			let cell: Cell = this.updateQueue.shift()!;
			let x = cell.x;
			let y = cell.y;
			changes.push(cell);
			let owner = cell.owner;
			if (cell.isFull()) {
				cell.clear();

				if (x + 1 < this.cells.length) {
					let cell: Cell = this.cells[x + 1]![y]!;
					changes.push(cell);
					cell!.owner = owner;
					cell!.color(3, false);
					if (cell!.isFull()) newQ.push(cell);
				}
				if (x - 1 >= 0) {
					let cell: Cell = this.cells[x - 1]![y]!;
					changes.push(cell);
					cell!.owner = owner;
					cell!.color(1, false);
					if (cell!.isFull()) newQ.push(cell);
				}
				if (y + 1 < this.cells.length) {
					let cell: Cell = this.cells[x]![y + 1]!;
					changes.push(cell);
					cell!.owner = owner;
					cell!.color(0, false);
					if (cell!.isFull()) newQ.push(cell);
				}
				if (y - 1 >= 0) {
					let cell: Cell = this.cells[x]![y - 1]!;
					changes.push(cell);
					cell!.owner = owner;
					cell!.color(2, false);
					if (cell!.isFull()) newQ.push(cell);
				}
			}
		}
		this.updateQueue = newQ;
		console.log(this.updateQueue);
		return changes;
	}
	clearCells(predicate: (cell: Cell) => boolean) {
		this.cells.forEach((x) =>
			x.forEach((cell) => {
				if (predicate(cell)) cell.clear();
			})
		);
	}
	getScores(): Map<number, number> {
		let score: Map<number, number> = new Map<number, number>();
		this.cells.forEach((row) => {
			row.forEach((cell) => {
				if (cell.owner == -1) return;
				score.set(cell.owner, (score.get(cell.owner) ?? 0) + 1);
			});
		});
		return score;
	}
}
export class Cell {
	owner: number = -1;
	filedSides: number[];
	x: number;
	y: number;
	constructor(size: number, x: number, y: number) {
		this.filedSides = new Array(size).fill(false, 0, size);
		this.x = x;
		this.y = y;
	}
	disableSide(side: number) {
		this.filedSides[side] = -1;
	}

	enableSide(side: number) {
		this.filedSides[side] = 0;
	}
	value(): number {
		let c = 0;
		this.filedSides.forEach((e: number) => {
			if (e == 1) c++;
		});
		return c;
	}
	maxValue(): number {
		return this.filedSides.length;
	}
	color(side: number, strict: boolean = true): boolean {
		// Disabled
		if (this.filedSides[side]! < 0) return false;

		// Avaliable
		if (this.filedSides[side] == 0) {
			this.filedSides[side] = 1;
			return true;
		}

		// Dont color another side if strict
		if (strict) return false;

		// Button already colored. color different side.
		for (let i = 0; i < this.filedSides.length; i++) {
			if (this.filedSides[i] == 1 || this.filedSides[i] == -1) continue;
			this.filedSides[i] = 1;
			break;
		}
		return true;
	}
	clear() {
		this.owner = -1;
		for (let i = 0; i < this.filedSides.length; i++) {
			if (this.filedSides[i] != 1) continue;
			this.filedSides[i] = 0;
		}
	}
	isFull(): boolean {
		for (let i = 0; i < this.filedSides.length; i++) {
			if (this.filedSides[i] == 1 || this.filedSides[i] == -1) {
				continue;
			}
			return false;
		}
		return true;
	}
}
