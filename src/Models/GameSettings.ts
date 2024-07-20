export class GameSettings {
	public boardSize: number;
	public turnOrder: number[];
	constructor(boardSize: number, turnOrder: number[]) {
		this.boardSize = boardSize;
		this.turnOrder = turnOrder;
	}
}
