import { BoxGeometry, Material, Mesh, MeshToonMaterial, Object3D, Scene } from "three";
import { Game } from "./Models/Game"
import { int } from "three/examples/jsm/nodes/Nodes.js";
import { Geometry } from "three/examples/jsm/deprecated/Geometry.js";

const colors = [0xFF6633, 0x99FF99, 0xFF33FF, 0xFFFF99, 0x00B3E6, 
                0xE6B333, 0x3366E6, 0x999966, 0xFFB399, 0xB34D4D,
                0x80B300, 0x809900, 0xE6B3B3, 0x6680B3, 0x66991A, 
                0xFF99E6, 0xCCFF1A, 0xFF1A66, 0xE6331A, 0x33FFCC,
                0x66994D, 0xB366CC, 0x4D8000, 0xB33300, 0xCC80CC, 
                0x66664D, 0x991AFF, 0xE666FF, 0x4DB3FF, 0x1AB399,
                0xE666B3, 0x33991A, 0xCC9999, 0xB3B31A, 0x00E680, 
                0x4D8066, 0x809980, 0xE6FF80, 0x1AFF33, 0x999933,
                0xFF3380, 0xCCCC00, 0x66E64D, 0x4D80CC, 0x9900B3, 
                0xE64D66, 0x4DB380, 0xFF4D4D, 0x99E6E6, 0x6666FF];

export class GameUI{
    private game: Game;
    private scene: Scene;
    private boxGeometry = new BoxGeometry(1,1,1);


    readonly btnSize=1;
    readonly btnMargin=.5;
    readonly btnGroupMargin=.5;

    constructor(game: Game, scene: Scene){
        this.game = game;
        this.scene = scene;
    }

    setGame(game: Game){
        this.game = this.game;
    }
    createGameGeometry(): Object3D{
        let gameBoard = new Object3D();
        let defaultColor = 0xEAF7FF;
        for(let x = 1; x<this.game.getBoardWidth()-1; x++){
            for(let y = 1; y<this.game.getBoardLength()-1; y++){
                let cell = this.game.gameBoard[x][y];
                let color = cell.owner<0?defaultColor:colors[cell.owner];
                if(this.game.gameBoard[x][y].owner>=0)
                    color = colors[this.game.gameBoard[x][y].owner];

                let btnGroupPosX = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*x;
                let btnGroupPosY = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*y;
                
                gameBoard.add(this.createBtn(
                    btnGroupPosX+this.btnSize+this.btnMargin*2+this.btnSize/2,
                    btnGroupPosY+this.btnMargin+this.btnSize/2,
                    [x,y],
                    0,
                    cell.filedSides[0] ? color:defaultColor
                ));
                gameBoard.add(this.createBtn(
                    btnGroupPosX+this.btnSize*2+this.btnMargin*3+this.btnSize/2,
                    btnGroupPosY+this.btnSize+this.btnMargin*2+this.btnSize/2,
                    [x,y],
                    1,
                    cell.filedSides[1] ? color:defaultColor
                ));
                gameBoard.add(this.createBtn(
                    btnGroupPosX+this.btnSize+this.btnMargin*2+this.btnSize/2,
                    btnGroupPosY+this.btnSize*2+this.btnMargin*3+this.btnSize/2,
                    [x,y],
                    2,
                    cell.filedSides[2] ? color:defaultColor
                ));
                gameBoard.add(this.createBtn(
                    btnGroupPosX+this.btnMargin+this.btnSize/2,
                    btnGroupPosY+this.btnSize+this.btnMargin*2+this.btnSize/2,
                    [x,y],
                    3,
                    cell.filedSides[3] ? color:defaultColor
                ));
            }
        }
        for(let x = 1; x<this.game.getBoardWidth()-1; x++){
            let y=0;
            let cell = this.game.gameBoard[x][y];
            let color = cell.owner<0?defaultColor:colors[cell.owner];
            if(this.game.gameBoard[x][y].owner>=0)
                color = colors[this.game.gameBoard[x][y].owner];

            let btnGroupPosX = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*x;
            let btnGroupPosY = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*y;
            // gameBoard.add(this.createBtn(
            //     btnGroupPosX+this.btnSize+this.btnMargin*2+this.btnSize/2,
            //     btnGroupPosY+this.btnMargin+this.btnSize/2,
            //     [x,y],
            //     0,
            //     cell.filedSides[0] ? color:defaultColor
            // ));
            gameBoard.add(this.createBtn(
                btnGroupPosX+this.btnSize*2+this.btnMargin*3+this.btnSize/2,
                btnGroupPosY+this.btnSize+this.btnMargin*2+this.btnSize/2,
                [x,y],
                0,
                cell.filedSides[0] ? color:defaultColor
            ));
            gameBoard.add(this.createBtn(
                btnGroupPosX+this.btnSize+this.btnMargin*2+this.btnSize/2,
                btnGroupPosY+this.btnSize*2+this.btnMargin*3+this.btnSize/2,
                [x,y],
                1,
                cell.filedSides[1] ? color:defaultColor
            ));
            gameBoard.add(this.createBtn(
                btnGroupPosX+this.btnMargin+this.btnSize/2,
                btnGroupPosY+this.btnSize+this.btnMargin*2+this.btnSize/2,
                [x,y],
                2,
                cell.filedSides[2] ? color:defaultColor
            ));
        }
        for(let x = 1; x<this.game.getBoardWidth()-1; x++){
            let y=this.game.getBoardLength()-1;
            let cell = this.game.gameBoard[x][y];
            let color = cell.owner<0?defaultColor:colors[cell.owner];
            if(this.game.gameBoard[x][y].owner>=0)
                color = colors[this.game.gameBoard[x][y].owner];

            let btnGroupPosX = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*x;
            let btnGroupPosY = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*y;
            
            gameBoard.add(this.createBtn(
                btnGroupPosX+this.btnSize+this.btnMargin*2+this.btnSize/2,
                btnGroupPosY+this.btnMargin+this.btnSize/2,
                [x,y],
                0,
                cell.filedSides[0] ? color:defaultColor
            ));
            gameBoard.add(this.createBtn(
                btnGroupPosX+this.btnSize*2+this.btnMargin*3+this.btnSize/2,
                btnGroupPosY+this.btnSize+this.btnMargin*2+this.btnSize/2,
                [x,y],
                1,
                cell.filedSides[1] ? color:defaultColor
            ));
            // gameBoard.add(this.createBtn(
            //     btnGroupPosX+this.btnSize+this.btnMargin*2+this.btnSize/2,
            //     btnGroupPosY+this.btnSize*2+this.btnMargin*3+this.btnSize/2,
            //     [x,y],
            //     2,
            //     cell.filedSides[2] ? color:defaultColor
            // ));
            gameBoard.add(this.createBtn(
                btnGroupPosX+this.btnMargin+this.btnSize/2,
                btnGroupPosY+this.btnSize+this.btnMargin*2+this.btnSize/2,
                [x,y],
                2,
                cell.filedSides[2] ? color:defaultColor
            ));
        }
        for(let y = 1; y<this.game.getBoardLength()-1; y++){
            let x=0;
            let cell = this.game.gameBoard[x][y];
            let color = cell.owner<0?defaultColor:colors[cell.owner];
            if(this.game.gameBoard[x][y].owner>=0)
                color = colors[this.game.gameBoard[x][y].owner];

            let btnGroupPosX = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*x;
            let btnGroupPosY = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*y;
            
            gameBoard.add(this.createBtn(
                btnGroupPosX+this.btnSize+this.btnMargin*2+this.btnSize/2,
                btnGroupPosY+this.btnMargin+this.btnSize/2,
                [x,y],
                0,
                cell.filedSides[0] ? color:defaultColor
            ));
            gameBoard.add(this.createBtn(
                btnGroupPosX+this.btnSize*2+this.btnMargin*3+this.btnSize/2,
                btnGroupPosY+this.btnSize+this.btnMargin*2+this.btnSize/2,
                [x,y],
                1,
                cell.filedSides[1] ? color:defaultColor
            ));
            gameBoard.add(this.createBtn(
                btnGroupPosX+this.btnSize+this.btnMargin*2+this.btnSize/2,
                btnGroupPosY+this.btnSize*2+this.btnMargin*3+this.btnSize/2,
                [x,y],
                2,
                cell.filedSides[2] ? color:defaultColor
            ));
            // gameBoard.add(this.createBtn(
            //     btnGroupPosX+this.btnMargin+this.btnSize/2,
            //     btnGroupPosY+this.btnSize+this.btnMargin*2+this.btnSize/2,
            //     [x,y],
            //     3,
            //     cell.filedSides[3] ? color:defaultColor
            // ));
        }
        for(let y = 1; y<this.game.getBoardLength()-1; y++){
            let x=this.game.getBoardWidth()-1;
            let cell = this.game.gameBoard[x][y];
            let color = cell.owner<0?defaultColor:colors[cell.owner];
            if(this.game.gameBoard[x][y].owner>=0)
                color = colors[this.game.gameBoard[x][y].owner];

            let btnGroupPosX = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*x;
            let btnGroupPosY = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*y;
            
            gameBoard.add(this.createBtn(
                btnGroupPosX+this.btnSize+this.btnMargin*2+this.btnSize/2,
                btnGroupPosY+this.btnMargin+this.btnSize/2,
                [x,y],
                0,
                cell.filedSides[0] ? color:defaultColor
            ));
            // gameBoard.add(this.createBtn(
            //     btnGroupPosX+this.btnSize*2+this.btnMargin*3+this.btnSize/2,
            //     btnGroupPosY+this.btnSize+this.btnMargin*2+this.btnSize/2,
            //     [x,y],
            //     1,
            //     cell.filedSides[1] ? color:defaultColor
            // ));
            gameBoard.add(this.createBtn(
                btnGroupPosX+this.btnSize+this.btnMargin*2+this.btnSize/2,
                btnGroupPosY+this.btnSize*2+this.btnMargin*3+this.btnSize/2,
                [x,y],
                1,
                cell.filedSides[1] ? color:defaultColor
            ));
            gameBoard.add(this.createBtn(
                btnGroupPosX+this.btnMargin+this.btnSize/2,
                btnGroupPosY+this.btnSize+this.btnMargin*2+this.btnSize/2,
                [x,y],
                2,
                cell.filedSides[2] ? color:defaultColor
            ));
        }
        //#region 0,0
        let x=0;
        let y=0;
        let cell = this.game.gameBoard[x][y];
        let color = cell.owner<0?defaultColor:colors[cell.owner];
        if(this.game.gameBoard[x][y].owner>=0)
            color = colors[this.game.gameBoard[x][y].owner];
        let btnGroupPosX = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*x;
        let btnGroupPosY = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*y;
        gameBoard.add(this.createBtn(
            btnGroupPosX+this.btnSize*2+this.btnMargin*3+this.btnSize/2,
            btnGroupPosY+this.btnSize+this.btnMargin*2+this.btnSize/2,
            [x,y],
            0,
            cell.filedSides[0] ? color:defaultColor
        ));
        gameBoard.add(this.createBtn(
            btnGroupPosX+this.btnSize+this.btnMargin*2+this.btnSize/2,
            btnGroupPosY+this.btnSize*2+this.btnMargin*3+this.btnSize/2,
            [x,y],
            1,
            cell.filedSides[1] ? color:defaultColor
        ));
        //#endregion
        //#region 0,max
        x=0;
        y=this.game.getBoardLength()-1;
        cell = this.game.gameBoard[x][y];
        color = cell.owner<0?defaultColor:colors[cell.owner];
        if(this.game.gameBoard[x][y].owner>=0)
            color = colors[this.game.gameBoard[x][y].owner];
        btnGroupPosX = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*x;
        btnGroupPosY = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*y;
        gameBoard.add(this.createBtn(
            btnGroupPosX+this.btnSize+this.btnMargin*2+this.btnSize/2,
            btnGroupPosY+this.btnMargin+this.btnSize/2,
            [x,y],
            0,
            cell.filedSides[0] ? color:defaultColor
        ));
        gameBoard.add(this.createBtn(
            btnGroupPosX+this.btnSize*2+this.btnMargin*3+this.btnSize/2,
            btnGroupPosY+this.btnSize+this.btnMargin*2+this.btnSize/2,
            [x,y],
            1,
            cell.filedSides[1] ? color:defaultColor
        ));
        //#endregion
        //#region max,0
        x=this.game.getBoardWidth()-1;
        y=0;
        cell = this.game.gameBoard[x][y];
        color = cell.owner<0?defaultColor:colors[cell.owner];
        if(this.game.gameBoard[x][y].owner>=0)
            color = colors[this.game.gameBoard[x][y].owner];
        btnGroupPosX = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*x;
        btnGroupPosY = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*y;
        gameBoard.add(this.createBtn(
            btnGroupPosX+this.btnSize+this.btnMargin*2+this.btnSize/2,
            btnGroupPosY+this.btnSize*2+this.btnMargin*3+this.btnSize/2,
            [x,y],
            0,
            cell.filedSides[0] ? color:defaultColor
        ));
        gameBoard.add(this.createBtn(
            btnGroupPosX+this.btnMargin+this.btnSize/2,
            btnGroupPosY+this.btnSize+this.btnMargin*2+this.btnSize/2,
            [x,y],
            1,
            cell.filedSides[1] ? color:defaultColor
        ));
        //#endregion
        //#region max,max
        x=this.game.getBoardWidth()-1;
        y=this.game.getBoardLength()-1;
        cell = this.game.gameBoard[x][y];
        color = cell.owner<0?defaultColor:colors[cell.owner];
        if(this.game.gameBoard[x][y].owner>=0)
            color = colors[this.game.gameBoard[x][y].owner];
        btnGroupPosX = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*x;
        btnGroupPosY = (this.btnSize*3+this.btnMargin*4+this.btnGroupMargin)*y;
        gameBoard.add(this.createBtn(
            btnGroupPosX+this.btnSize+this.btnMargin*2+this.btnSize/2,
            btnGroupPosY+this.btnMargin+this.btnSize/2,
            [x,y],
            0,
            cell.filedSides[0] ? color:defaultColor
        ));
        gameBoard.add(this.createBtn(
            btnGroupPosX+this.btnMargin+this.btnSize/2,
            btnGroupPosY+this.btnSize+this.btnMargin*2+this.btnSize/2,
            [x,y],
            1,
            cell.filedSides[1] ? color:defaultColor
        ));
        //#endregion
        console.log(this.game);
        console.log(gameBoard);
        return gameBoard;
    }
    createBtn(x:number, y:number, group: number[], side: number, color: number): Mesh{
        let m = new Mesh(this.boxGeometry,new MeshToonMaterial( { color: color} ));
                m.position.set(x,0,y);
                m.scale.set(this.btnSize,this.btnSize,this.btnSize);
                m.userData.tag="btn";
                m.userData.group=group;
                m.userData.side=side;
        return m;
    }

}