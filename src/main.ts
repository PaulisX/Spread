import * as THREE from 'three';
import {ClientMessageTypes, ServerMessageTypes} from "./MessageTypes.ts";
import { OrbitControls } from 'three/addons'
import { peerJsClient } from './Networking/PeerJsClient.ts';
import { Client } from './Networking/Client.ts';
import { Server } from './Networking/Server.ts';
import { peerJsServer } from './Networking/PeerJsServer.ts';
import { Message } from './Networking/Models/Message';
import { color, func, int, userData } from 'three/examples/jsm/nodes/Nodes.js';
import { Player } from './Models/Player.ts';
import { ClientData } from './Networking/Models/ClientData.ts';
import { ClientEvents } from './Networking/Client';
import { GameUI } from './GameUI.ts';
import { Mesh, Material } from 'three';
import './Utils/Object3DExtensions.ts';
import { Game } from './Models/Game';

let client: Client;
let server: Server;
let game: Game|null;
let currentTurn: number=0;
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

var connectScreen = document.getElementById('connectUi')!;
var lobbyScreen = document.getElementById('lobbyUi')!;
var lobbyMembers = document.getElementById('lobbyMembers')!;
connectScreen.style.display = "none";
lobbyScreen.style.display = "none";

// #region Initialize connectScreen
connectScreen.style.display = "block";
(<HTMLFormElement>document.getElementById('actionForm')).addEventListener('submit',(ev:SubmitEvent)=>{
    ev.preventDefault();
    const data: FormData = new FormData(ev.target as HTMLFormElement);
    console.log(ev);
    if((<HTMLInputElement>ev.submitter).value =='host')
        Host(data.get('username')?.toString()??'fail');
    else
        Join(data.get('hostId')?.toString()??"fail", data.get('username')?.toString()??"fail");

});
// #endregion


function Join(hostId: string, username: string){
    console.log("Joining ...");
    if(client==null){
        console.log("create client!");
        client = new peerJsClient();
    }
    console.log("seting events ..."); 
    client.events.on("onMessage", (msg: Message)=> {
        handleClientMessage(msg);
    });
    client.events.on("started",(id:string)=>{
        console.log("started, Connecting ...",id);
        client.connect(hostId, username);
    });
    client.events.on("onConnected",()=>{
        connectScreen.style.display = "none";
        lobbyScreen.style.display = "block";
        client.sendMessage({type: ServerMessageTypes.GetLobbyMemberList,content:""})
    });
    
    console.log("Setting UI ...");
    connectScreen.style.display = "none";
    lobbyScreen.style.display = "block";
    (<HTMLInputElement>document.getElementById('joinCode')).value=hostId;
}
function Host(username: string){

    let startGameBtn = (<HTMLButtonElement>document.getElementById('startGameBtn'))!;
    startGameBtn.style.display="block";
    startGameBtn.addEventListener("click",(e:MouseEvent)=>{
        console.log("Starting game ...");
        lobbyScreen.style.display="none";
        client.sendMessage({type: ClientMessageTypes.StartGame, content: ""});
    });

    server = new peerJsServer();
    server.events.on("started",()=>{
        Join(server.id,username);
    });
    server.events.on("onMessage",(msg: Message, clientId: number)=>handleServerMessage(msg,clientId));
    server.events.on("onConnected",(client)=>{
        server.sendMessageAllExcept({
            type: ClientMessageTypes.PlayerJoinedLobby,
            content: JSON.stringify(client)
        },client.id);
    });
}

function handleServerMessage(msg: Message, clientId: number){
    // console.log(msg,clientId);
    switch(msg.type){
        case 0:
            server.sendMessage({
                type: ClientMessageTypes.LobbyMemberList,
                content: JSON.stringify(server.getClients())
            }, clientId);
            console.log("Responds to GetLobbyMemberList");
            break;
        case ClientMessageTypes.StartGame:{
            game = new Game();
            game.initGame(5);
            server.sendMessageAll({type:ClientMessageTypes.StartGame,content:JSON.stringify(5)});
            break;
        }
        case ClientMessageTypes.HoverBtn:{
            server.sendMessageAllExcept(msg,clientId);
            break;
        }
        case ClientMessageTypes.PerformTurn:{
            console.log("server handle turn");
            let el:number[] = JSON.parse(msg.content);
            el.push(clientId);
            if(game == undefined || game==null){
                console.error("Game is null!");
                break;
            }
            if(!game.move(clientId,el[0],el[1],el[2])){
                console.log("Illegal move");
                break;
            }
            server.sendMessageAll({type:ClientMessageTypes.PerformTurn ,content:JSON.stringify(el)});
            console.log("server turn msg");
            break;
        }
        default:
            console.error("Unknown message!",msg);
            break;
    }
}
async function handleClientMessage(msg: Message){
    console.log(msg);
    switch(msg.type){
        case ClientMessageTypes.LobbyMemberList:
            console.log("member list!");
            let members:ClientData[]  = JSON.parse(msg.content);
            lobbyMembers.innerHTML = "";
            members.forEach(element => {
                lobbyMembers.innerHTML+= `<li>${element.id}: ${element.username}</li>`;
            });
            break;
        case ClientMessageTypes.PlayerJoinedLobby:
            console.log("Player joined lobby!");
            let client:ClientData = JSON.parse(msg.content);
            lobbyMembers.innerHTML+= `<li>${client.id}: ${client.username}</li>`;
            break;
        case ClientMessageTypes.PlayerLeftLobby:
            console.error("Player left not implemented!");
            break;
        case ClientMessageTypes.StartGame:
            if(game==null){
                game = new Game();
                game.initGame(5);
                // game.setBoard(JSON.parse(msg.content));
            }
            console.log("Starting game ...");
            gameBoard = new GameUI(game!,scene).createGameGeometry();
            scene.add(gameBoard);
            break;
        case ClientMessageTypes.HoverBtn:
            let btnId:number = JSON.parse(msg.content);
            if(btnId==-1){
                if(remoteHover!=null)
                    remoteHover.position.set(remoteHover.position.x,0,remoteHover.position.z);
                break;
            }
            let newRemoteHover = gameBoard.getObjectById(btnId)??null;
            console.log(newRemoteHover);
            if(remoteHover!=null)
                remoteHover.position.set(remoteHover.position.x,0,remoteHover.position.z);
            if(newRemoteHover==null)
                break;
            remoteHover = newRemoteHover;
            remoteHover.position.set(remoteHover.position.x,0.5,remoteHover.position.z);
            break;
        case ClientMessageTypes.PerformTurn:{
            let el:number[] = JSON.parse(msg.content);
            console.log("client handle turn",el[0],el[1]);
            if(server==null){
                if(!game?.move(el[3],el[0],el[1],el[2])){
                    console.error("Failed to performed remote turn!", msg);
                    break;
                }
            }

            scene.remove(gameBoard);
            gameBoard = (new GameUI(game!, scene)).createGameGeometry();
            scene.add(gameBoard);
            while(game!.update()){
                await delay(500);
                scene.remove(gameBoard);
                gameBoard = (new GameUI(game!, scene)).createGameGeometry();
                scene.add(gameBoard);
            }
            break;
        }
        default:
            console.error("Unknown message!",msg);
            break;
    }
}
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

let remoteHover: THREE.Object3D | null = null;
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.target.set((.5*1+.5*4+3)*2+(.5*0+.5*2+1.5),0,(.5*1+.5*4+3)*2+(.5*0+.5*2+1.5));
    

const scene = new THREE.Scene();
scene.background = new THREE.Color('#fbd2d2');
let gameBoard: THREE.Object3D;


const boxGeometry = new THREE.BoxGeometry( 1, 1, 1 );
const cube = new THREE.Mesh( boxGeometry, new THREE.MeshToonMaterial( { color: 0x00ff00 } ) );
const cubeR = new THREE.Mesh( boxGeometry, new THREE.MeshToonMaterial( { color: 0xff0000 } ) );
const cubeU = new THREE.Mesh( boxGeometry, new THREE.MeshToonMaterial( { color: 0x00ff00 } ) );
const cubeF = new THREE.Mesh( boxGeometry, new THREE.MeshToonMaterial( { color: 0x0000ff } ) );
cubeR.position.set(2,0,0);
cubeU.position.set(0,2,0);
cubeF.position.set(0,0,2);
scene.add( cube, cubeR, cubeU, cubeF );

const spotLight1:THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, Math.PI/2);
const spotLight2:THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, Math.PI/4);
spotLight1.position.set(1,1,1);
spotLight1.position.set(-1,-1,-1);
scene.add(spotLight1, spotLight2);

const raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2()


updateFrame();

function updateFrame() {
	requestAnimationFrame( updateFrame );
	renderer.render( scene, camera );
}

renderer.domElement.addEventListener("mousemove", onMouseMove, false);
renderer.domElement.addEventListener("mousedown", onMouseClick, false);
let lastHovered: THREE.Object3D | null = null;
function onMouseClick(){
    console.log("mouse click");
    if(lastHovered==null || lastHovered.userData["tag"]!="btn"){
        return;
    }
    let coords: number[] = lastHovered.userData["group"];
    if(game!.gameBoard[coords[0]][coords[1]].filedSides[lastHovered.userData.side]){
        return;
    }
    console.log("clicked", lastHovered.userData.group[0],lastHovered.userData.group[1]);
    client.sendMessage({type:ClientMessageTypes.PerformTurn,content:JSON.stringify(
        [lastHovered.userData.group[0],lastHovered.userData.group[1],lastHovered.userData.side])});
}
function onMouseMove(event: MouseEvent){
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObject(scene, true);
    let object: THREE.Object3D|null = null;
    
    if (intersects.length > 0) {
        object = intersects[0].object;
    }
    if(!object?.userData["tag"] || object.userData["tag"]!="btn"){
        if(lastHovered==null)
            return;
        lastHovered.position.set(lastHovered.position.x,0,lastHovered.position.z);
        lastHovered=null;
        client.sendMessage({type:ClientMessageTypes.HoverBtn,content:JSON.stringify(-1)});
        return;
    }

    object.position.set(object.position.x,.5,object.position.z);
    if(object!=lastHovered){
        client.sendMessage({type:ClientMessageTypes.HoverBtn,content:JSON.stringify(object?.id??-1)});
        lastHovered = object;
    }
    return;
}

//#region resize
window.addEventListener("resize", onWindowResize);
function onWindowResize(event: Event): void {
    camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
//#endregion