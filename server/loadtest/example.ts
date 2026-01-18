import { Client, Room } from "colyseus.js";
import { cli, Options } from "@colyseus/loadtest";
import {GameSchema} from "../src/rooms/schema/Game"
async function main(options: Options) {
    const client = new Client(options.endpoint);
    const room: Room<GameSchema> = await client.joinOrCreate(options.roomName, {
        name:"tUser"
    });
    
    console.log("joined successfully!");
    
    room.onMessage("*", (type, message) => {
        console.log("onMessage:", type, message);
    });
 
    room.onStateChange(async (state) => {
        console.log(room.sessionId, "new state:", state);
        if(state.players.size == 8 && state.started == false){
            await room.send("start_game");
            setInterval(async() =>{
                room.send("select_button",{buttonId:Math.round(Math.random()*25)});
            },1000);
        }
    });
 
    room.onError((err,msg) => {
        console.log(room.sessionId, "!! ERROR !!", msg);
    })
 
    room.onLeave((code) => {
        console.log(room.sessionId, "left.");
    });
}
 
cli(main);