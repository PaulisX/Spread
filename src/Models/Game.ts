export class Game{
    turnCount:number = 0;
    gameBoard: Cell[][] = [];
    updateQueue: number[][];
    constructor(){
        this.updateQueue = [];
    }
    initGame (boardSize: number){
        this.gameBoard= new Array(boardSize)
        for(let i = 0; i < boardSize; i++){
            this.gameBoard[i]= new Array(boardSize)
        }
        for (let i = 1; i < boardSize-1; i++) {
            for (let j = 1; j < boardSize-1; j++) {
                this.gameBoard[i][j]=new Cell(4);
            }
        }
        for (let i = 1; i < boardSize-1; i++) {
            this.gameBoard[i][0]=new Cell(3);
            this.gameBoard[i][boardSize-1]=new Cell(3);
            this.gameBoard[0][i]=new Cell(3);
            this.gameBoard[boardSize-1][i]=new Cell(3);
        }
        this.gameBoard[0][0]=new Cell(2);
        this.gameBoard[0][boardSize-1]=new Cell(2);
        this.gameBoard[boardSize-1][0]=new Cell(2);
        this.gameBoard[boardSize-1][boardSize-1]=new Cell(2);
    }
    setBoard(gameBoard: Cell[][]){
        this.gameBoard = gameBoard
    }
    setTurnCount(turnCount: number){
        this.turnCount = turnCount;
    }
    getBoard():Cell[][]{
        return this.gameBoard;
    }
    getTurnCount():number{
        return this.turnCount;
    }
    getBoardWidth():number{
        return this.gameBoard.length;
    }
    getBoardLength():number{
        return this.gameBoard[0].length;
    }
    getExplosions():number[][]{
        return JSON.parse(JSON.stringify(this.updateQueue));
    } 
    move(owner: number, x: number, y:number,side:number):boolean{
        const cell = this.gameBoard[x][y];
        if(cell.owner != owner && cell.owner != -1){
            console.log(cell, owner);
            return false;
        }
        this.gameBoard[x][y].color(side);
        this.gameBoard[x][y].owner = owner;
        if(this.gameBoard[x][y].isFull()){
            console.log("reach max");
            let el: number[] =[x,y]; 
            this.updateQueue.push(el);
            console.log("add to ex queue!", this.updateQueue);
        }
        return true;
    }
    update(): boolean{
        let newQ:number[][] = [];
        let fin = false;
        // let exploded:number[][] = [];

        console.log(this.updateQueue);
        while(this.updateQueue.length>0){
            let gr: number[]|undefined = this.updateQueue.shift();
            if(!gr){
                console.error("error!");
                return false;
            }
            let x=gr[0], y=gr[1];
            let cell = this.gameBoard[x][y];
            let owner = cell.owner;
            if(cell.isFull()){
                fin = true;
                this.gameBoard[x][y].clear();

                if(x+1 < this.gameBoard.length)
                {
                    this.gameBoard[x+1][y].owner = owner;
                    this.gameBoard[x+1][y].color(3);
                    if(this.gameBoard[x+1][y].isFull())
                        newQ.push([x+1,y])

                }
                if(x-1 >= 0)
                {
                    console.log("x-1>=0",x-1,y,this.gameBoard);
                    this.gameBoard[x-1][y].owner = owner;
                    this.gameBoard[x-1][y].color(1);
                    if(this.gameBoard[x-1][y].isFull())
                        newQ.push([x-1,y])
                }
                if(y+1 < this.gameBoard.length)
                {
                    this.gameBoard[x][y+1].owner = owner;
                    this.gameBoard[x][y+1].color(0);
                    if(this.gameBoard[x][y+1].isFull())
                        newQ.push([x,y+1])
                }
                if(y-1 >= 0)
                {
                    console.log("y-1>=0",x,y-1,this.gameBoard);
                    this.gameBoard[x][y-1].owner = owner;
                    this.gameBoard[x][y-1].color(2);    
                    if(this.gameBoard[x][y-1].isFull())
                        newQ.push([x,y-1])
                }
            }
            console.log(cell);
        }
        this.updateQueue = newQ;
        console.log(this.updateQueue);
        return fin;
    }
}
export class Cell {
    owner: number=-1;
    filedSides: boolean[];
    constructor (size:number){
        this.filedSides = new Array(size).fill(false,0,size);
        this.filedSides.fill(false,0,size);
    }
    value(): number{
        let c=0;
        this.filedSides.forEach((e:boolean) => {
            if(e==true)
                c++;
        });
        return c;
    }
    maxValue(): number{
        return this.filedSides.length;
    }
    color(prefSide:number){
        if(prefSide<this.filedSides.length && !this.filedSides[prefSide]){
            this.filedSides[prefSide]=true;
            return;
        }
        for(let i = 0; i < this.filedSides.length; i++){
            if(!this.filedSides[i]){
                this.filedSides[i]=true;
                return;
            }
        }
    }
    clear(){
        this.owner=-1;
        for(let i = 0; i < this.filedSides.length; i++){
            this.filedSides[i]=false;
        }
    }
    isFull(): boolean{
        for(let i = 0; i< this.filedSides.length; i++){
            if(this.filedSides[i]==true) {
                continue;
            }
            return false;
        }
        return true;
    }
}
export type GameEvents = {
    'onExplode': [owner: number,x: number, y: number]
}