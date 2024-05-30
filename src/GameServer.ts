import { ClientMessageTypes, ServerMessageTypes } from "./MessageTypes";
import { GameBoard } from "./Models/Game";
import { Message } from "./Networking/Models/Message";
import { peerJsServer } from "./Networking/PeerJsServer";
import { Server } from './Networking/Server';
import { TypedEventEmitter } from "./Utils/TypedEventEmitter";
import EventEmitter from 'eventemitter3';

export class GameServer{
    gameBoard: GameBoard|null = null;
    
    server: Server|null = null;
    started: boolean = false;
    errored: boolean = false;

    currentTurn: number = 0;
    turnCount: number = 0;
    clientCount: number=0;

    events: EventEmitter = new EventEmitter();

    constructor(){
    }
    getId():string{
        if(this.server==null)
            throw new Error("server is null");
        return this.server!.id;
    }
    waitForEvent<T>(emitter: TypedEventEmitter<any>, event: string): Promise<T> {
        return new Promise((resolve, reject) => {
            emitter.once(event, resolve);
            emitter.once("error", reject);        
        });
    }
    async startServer(){
        this.server = new peerJsServer();
        // TODO: Handle promise.reject
        await this.waitForEvent(this.server.events,"started");

        this.server.events.on("error",(err: Error)=>{
            this.errored = true;
        });
        this.server.events.on("onMessage",(msg: Message, clientId: number)=>{
            this.handleServerMessage(msg,clientId);
        });
        this.server.events.on("onConnected",(client)=>{
            console.log("Client connected ", client.username);
            this.server!.sendMessageAllExcept({
                type: ServerMessageTypes.PlayerJoinedLobby,
                content: JSON.stringify(client)
            },client.id);
        });
        this.server.events.on("onDisconnected",()=>{

        });
        
        this.started = true;
    }
    getScores(): number[]{
        let score: number[] = new Array(this.server?.getClientCount()).fill(0);
        this.gameBoard!.cells.forEach(row => {
            row.forEach(cell=>{
                if(cell.owner==-1)
                    return;
                score[cell.owner] += 1;
            });
        });
        return score;
    }
    handleServerMessage(msg: Message, clientId: number){
        switch(msg.type){
            case ClientMessageTypes.GetLobbyMemberList:
                this.server!.sendMessage({
                    type: ServerMessageTypes.LobbyMemberList,
                    content: JSON.stringify(this.server!.getClients())
                }, clientId);
                break;
            case ClientMessageTypes.StartGame:{
                //TODO: implement check for rights to start game
                this.gameBoard = new GameBoard();
                this.gameBoard.initGame(5);
                this.server!.sendMessageAll({
                    type: ServerMessageTypes.StartGame,
                    content: JSON.stringify({"size":5, "nextTurn":this.currentTurn})
                });
                this.clientCount = this.server!.getClientCount();
                console.log("Client count: ", this.clientCount);
                break;
            }
            case ClientMessageTypes.HoverBtn:{
                if(this.gameBoard==null){
                    console.warn("Client tried to perform turn with null game board. message, clientId: ", msg, clientId)
                    break;
                }
                if(this.currentTurn!=clientId){
                    break;
                }
                this.server!.sendMessageAllExcept({
                    type: ServerMessageTypes.HoverBtn,
                    content: msg.content
                },clientId);
                break;
            }
            case ClientMessageTypes.PerformTurn:{
                let el:number[] = JSON.parse(msg.content);
                el.push(clientId);
                if(this.gameBoard==null){
                    console.warn("Client tried to perform turn with null game board. message, clientId: ", msg, clientId)
                    break;
                }
                if(clientId != this.currentTurn){
                    console.warn("Client tried to perform outside their turn: ", this.currentTurn, clientId, this.clientCount)
                    break;
                }
                if(!this.gameBoard.move(clientId,el[0],el[1],el[2])){
                    console.warn("illegal move", el);
                    break;
                }
                let i = 0;
                let scores :number[] = this.getScores();
                let gameEnd = false;
                while(this.gameBoard!.update()){
                    if(++i > 100){
                        console.error("Hit 100 iterations");
                        break;
                    }
                    if(this.turnCount > this.currentTurn){
                        scores = this.getScores();
                        let alivePlayers = 0;
                        scores.forEach((v)=>{
                            if(v>0) alivePlayers++;
                        });
                        if(alivePlayers<=1){
                            gameEnd = true;
                        }
                    }
                }
                this.currentTurn = (this.currentTurn+1) % this.clientCount;
                this.turnCount ++;
                this.server!.sendMessageAll({
                    type: ServerMessageTypes.PerformTurn,
                    content: JSON.stringify({move: el, score: scores, gameEnd: gameEnd, nextTurn: this.currentTurn})});
                    
                if(gameEnd){
                    this.events.emit("gameOver");
                }
                break;
            }
            default:
                console.error("Unknown message!",msg);
                break;
        }
    }
    destroy(){
        this.server!.destroy();
    }
}