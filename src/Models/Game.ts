export class GameBoard{
    cells: Cell[][] = [];
    updateQueue: number[][];
    constructor(){
        this.updateQueue = [];
    }
    initGame (boardSize: number){
        this.cells= new Array(boardSize)
        for(let i = 0; i < boardSize; i++){
            this.cells[i]= new Array(boardSize)
        }
        for (let i = 1; i < boardSize-1; i++) {
            for (let j = 1; j < boardSize-1; j++) {
                this.cells[i][j]=new Cell(4);
            }
        }
        for (let i = 1; i < boardSize-1; i++) {
            this.cells[i][0]=new Cell(3);
            this.cells[i][boardSize-1]=new Cell(3);
            this.cells[0][i]=new Cell(3);
            this.cells[boardSize-1][i]=new Cell(3);
        }
        this.cells[0][0]=new Cell(2);
        this.cells[0][boardSize-1]=new Cell(2);
        this.cells[boardSize-1][0]=new Cell(2);
        this.cells[boardSize-1][boardSize-1]=new Cell(2);
    }
    setBoard(gameBoard: Cell[][]){
        this.cells = gameBoard
    }
    getBoard():Cell[][]{
        return this.cells;
    }
    getBoardWidth():number{
        return this.cells.length;
    }
    getBoardLength():number{
        return this.cells[0].length;
    }
    getExplosions():number[][]{
        return JSON.parse(JSON.stringify(this.updateQueue));
    }
    move(owner: number, x: number, y:number,side:number):boolean{
        const cell = this.cells[x][y];
        if(cell.owner != owner && cell.owner != -1){
            console.log(cell, owner);
            return false;
        }
        this.cells[x][y].color(side);
        this.cells[x][y].owner = owner;
        if(this.cells[x][y].isFull()){
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
            let cell = this.cells[x][y];
            let owner = cell.owner;
            if(cell.isFull()){
                fin = true;
                this.cells[x][y].clear();

                if(x+1 < this.cells.length)
                {
                    this.cells[x+1][y].owner = owner;
                    this.cells[x+1][y].color(3);
                    if(this.cells[x+1][y].isFull())
                        newQ.push([x+1,y])

                }
                if(x-1 >= 0)
                {
                    console.log("x-1>=0",x-1,y,this.cells);
                    this.cells[x-1][y].owner = owner;
                    this.cells[x-1][y].color(1);
                    if(this.cells[x-1][y].isFull())
                        newQ.push([x-1,y])
                }
                if(y+1 < this.cells.length)
                {
                    this.cells[x][y+1].owner = owner;
                    this.cells[x][y+1].color(0);
                    if(this.cells[x][y+1].isFull())
                        newQ.push([x,y+1])
                }
                if(y-1 >= 0)
                {
                    console.log("y-1>=0",x,y-1,this.cells);
                    this.cells[x][y-1].owner = owner;
                    this.cells[x][y-1].color(2);    
                    if(this.cells[x][y-1].isFull())
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