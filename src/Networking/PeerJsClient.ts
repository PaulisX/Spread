import { Client, ClientEvents } from './Client';
import { TypedEventEmitter } from "../Utils/TypedEventEmitter";
import Peer from "peerjs";
import type { BaseConnectionErrorType, DataConnection, DataConnectionErrorType, PeerError, PeerErrorType } from "peerjs";
import { Message } from './Models/Message';
import { func } from 'three/examples/jsm/nodes/Nodes.js';

export class peerJsClient implements Client{
    readonly events: TypedEventEmitter<ClientEvents>;
    
    public id: string = "";
    protected peer: Peer;
    protected connection: DataConnection | undefined;
    isConnected(): boolean {
        if(!this.connection)
            return false;
        if(!this.connection.open)
            return false
        return true;
    }

    constructor(){
        this.events = new TypedEventEmitter<ClientEvents>();
        this.peer = new Peer();
        this.peer.on('open', (id) => {this.id=id;console.log('My peer ID is: ' + id); this.events.emit("started",id);});
        this.peer.on('error',(err:PeerError<any>) => {this.peer.destroy(); throw Error(err.name + ": "+err.message);});
    }
    connect(serverCode: string, username?: string){
        this.connection = this.peer.connect(serverCode,{metadata:username,reliable:false});
        this.connection!.on("open",  ()=> {
            console.log("conn open!");
            this.connection!.on("data",  (data:any)=>  {
                this.events.emit("onMessage", data as Message);
            });
            this.connection!.on("close", ()=>{console.log("close connection");  this.events.emit("onDisconnected", false);} );
            this.connection!.on("error", (err:PeerError<"not-open-yet" | "message-too-big" | "negotiation-failed" | "connection-closed">) =>    {this.connection!.close(); throw err;});
            this.events.emit("onConnected");
        });
    }
    disconnect(): void {
        if(typeof this.connection === 'undefined')
            return;
        this.connection!.close();
    }
    sendMessage(message: Message): void {
        if(typeof this.connection === 'undefined')
            return;
        this.connection!.send(message);
    }
}
