import * as THREE from 'three';
import {ClientMessageTypes, ServerMessageTypes} from "./MessageTypes.ts";
import { OrbitControls } from 'three/addons'
import { peerJsClient } from './Networking/PeerJsClient.ts';
import { Client } from './Networking/Client.ts';
import { Server } from './Networking/Server.ts';
import { peerJsServer } from './Networking/PeerJsServer.ts';
import { Message } from './Networking/Models/Message';
import { color, func, int, userData, string } from 'three/examples/jsm/nodes/Nodes.js';
import { Player } from './Models/Player.ts';
import { ClientData } from './Networking/Models/ClientData.ts';
import { ClientEvents } from './Networking/Client';
import { GameUI } from './GameUI.ts';
import { Mesh, Material } from 'three';
import './Utils/Object3DExtensions.ts';
import { GameBoard } from './Models/Game';
import { GameServer } from './GameServer';
import { delay } from './Utils/Delay.ts';

let client: Client;
// let server: Server;
let gameServer: GameServer | null;
let game: GameBoard|null;
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
    
let connectUI = document.getElementById('connectUi')!;

let lobbyUI = document.getElementById('lobbyUi')!;
let lobbyUIMembers = document.getElementById('lobbyMembers')!;

let gameUI = document.getElementById('gameUi')!;
let gameUIMembers = document.getElementById('gameMembers')!;

let gameOverScreen = document.getElementById('gameOverScreen')!;
let winnerText = document.getElementById('winnerText')!;

connectUI.style.display = "none";
lobbyUI.style.display = "none";
connectUI.style.display = "block";
gameOverScreen.style.display = "none";

let animating = false;
let members: ClientData[]=[];
let currentTurn: number=0;

// #region Initialize connectScreen
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
    client.events.on("started",(id:string)=>{
        console.log("started, Connecting ...",id);
        client.connect(hostId, username);
    });
    client.events.on("onMessage", (msg: Message)=> {
        handleClientMessage(msg);
    });
    client.events.on("onConnected",()=>{
        console.log("Connected to server");
        connectUI.style.display = "none";
        lobbyUI.style.display = "block";
        client.sendMessage({
            type: ClientMessageTypes.GetLobbyMemberList,
            content:""})
    });
    
    console.log("Setting UI ...");
    connectUI.style.display = "none";
    lobbyUI.style.display = "block";
}
async function Host(username: string){ 
    // TODO: Handle fail to start
    console.log("Starting game ...");
    gameServer = new GameServer();
    await gameServer.startServer();
    // if(!gameServer.started){
    //     console.error("Failed to start error!");
    //     return;
    // }
    
    console.log("Joining game ...");
    Join(gameServer.getId(),username);
    gameServer.events.on("gameOver",()=>{
        console.log("Server destroyed!");
        gameServer!.destroy();
    });
    // Set start game btn
    let startGameBtn = (<HTMLButtonElement>document.getElementById('startGameBtn'))!;
    startGameBtn.style.display="block";
    startGameBtn.addEventListener("click",(e:MouseEvent)=>{
        if(members.length<2){
            console.warn("Cant start server with less than 2 players!");
            return;
        }
        console.log("Starting game ...");
        client.sendMessage({type: ClientMessageTypes.StartGame, content: ""});
    });
    // set cpy join code btn
    let cpuJoinCodeBtn = (<HTMLButtonElement>document.getElementById('cpyJoinCodeBtn'))!;
    cpuJoinCodeBtn.addEventListener("click",(e:MouseEvent)=>{
        navigator.clipboard.writeText(gameServer!.getId());
    });

}
function getScores(): number[]{
    let score: number[] = new Array(members.length).fill(0);
    game!.cells.forEach(row => {
        row.forEach(cell=>{
            if(cell.owner==-1)
                return;
            score[cell.owner] += 1;
        });
    });
    return score;
}
async function handleClientMessage(msg: Message){
    console.log(msg);
    switch(msg.type){
        case ServerMessageTypes.LobbyMemberList:
            console.log("member list!");
            members = JSON.parse(msg.content);
            console.log("Members list",members);
            lobbyUIMembers.innerHTML = "";
            members.forEach(element => {
                lobbyUIMembers.innerHTML += `<li style="display: flex;  flex-direction: row;align-content: flex-end;" id="l-pid-${element.id}"><img src="./public/vite.svg" style="padding-right:10px;"><h3>${element.username}</h3></li>`;
            });
            break;
        case ServerMessageTypes.PlayerJoinedLobby:
            console.log("Player joined lobby!");
            let client:ClientData = JSON.parse(msg.content);
            members.push(client);
            console.log("Members list",members);
            lobbyUIMembers.innerHTML += `<li style="display: flex; flex-direction: row;align-content: flex-end;" id="l-pid-${client.id}" ><img src="./public/vite.svg" style="padding-right:10px;"><h3>${client.username}</h3></li>`;
            break;
        case ServerMessageTypes.PlayerLeftLobby:
            let pid = msg.content;
            console.log(`Player ${pid} left.`);
            document.getElementById(`l-pid-${pid}`);
            break;
        case ServerMessageTypes.StartGame:
            let m = JSON.parse(msg.content);
            let boardSize:number = m.size;
            let nextTurn:number = m.nextTurn;
            
            startGame();
            console.log("get",`g-pid-${nextTurn}`);
            console.log(document.getElementById(`g-pid-${nextTurn}`));
            document.getElementById(`g-pid-${nextTurn}`)!.classList.add("current-turn");
            currentTurn = nextTurn;
            break;
        case ServerMessageTypes.HoverBtn:
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
        case ServerMessageTypes.PerformTurn:{
            let m = JSON.parse(msg.content);
            let move:number[] = m.move;
            let gameOver: boolean = m.gameEnd;
            let serverScore :number[] = m.score;
            let nextTurn: number = m.nextTurn;


            console.log("client handle turn",move[0],move[1]);
            if(!game?.move(move[3],move[0],move[1],move[2])){
                console.error("Failed to performed remote turn!", msg);
                break;
            }

            
            scene.remove(gameBoard);
            gameBoard = (new GameUI(game!, scene)).createGameGeometry();
            scene.add(gameBoard);
            animating = true;
            let score: number[];
            while(game!.update()){
                await delay(500);
                scene.remove(gameBoard);
                gameBoard = (new GameUI(game!, scene)).createGameGeometry();
                scene.add(gameBoard);
                if(gameOver){
                    score = getScores();
                    let alive = 0;
                    score.forEach((v)=>{
                        if(v>0)alive++;
                    })
                    if(alive<=1) break;
                }
            }
            animating = false;
            
            score = getScores();
            for(let i = 0; i < serverScore.length; i++){
                if(score[i]!=serverScore[i]){
                    console.error("Scores don't match: ", serverScore, score);
                }
            }

            if(gameOver){
                for(let i = 0; i < score.length; i++){
                    if(score[i]>0){
                        gameOverF(members[i].username);
                        break;
                    }
                }
            }

            document.getElementById(`g-pid-${currentTurn}`)?.classList.remove("current-turn");
            document.getElementById(`g-pid-${nextTurn}`)?.classList.add("current-turn");
            currentTurn = nextTurn;

            break;
        }
        default:
            console.error("Unknown message!",msg);
            break;
    }
}

function gameOverF(winnerName: string):void{
    console.log("Game over!");
    gameServer = null;
    renderer.domElement.removeEventListener("mousemove", onMouseMove, false);
    renderer.domElement.removeEventListener("mousedown", onMouseClick, false);
    gameOverScreen.style.display='block';
    winnerText.innerHTML = winnerName;
}
function startGame():void{
    console.log("Starting game ...");
    game = new GameBoard();
    game.initGame(5);
    
    gameBoard = new GameUI(game!,scene).createGameGeometry();
    scene.add(gameBoard);

    lobbyUI.style.display='none';
    gameUI.style.display='block';
    members.forEach(p => {
        gameUIMembers.innerHTML += `<li style="display: flex; flex-direction: row;align-content: flex-end;" id="g-pid-${p.id}"><img src="./public/vite.svg" style="padding-right:10px;"><h3>${p.username}</h3></li>`;
    });

    renderer.domElement.addEventListener("mousemove", onMouseMove, false);
    renderer.domElement.addEventListener("mousedown", onMouseClick, false);
}


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.target.set((.5*1+.5*4+3)*2+(.5*0+.5*2+1.5),0,(.5*1+.5*4+3)*2+(.5*0+.5*2+1.5));

const scene = new THREE.Scene();
scene.background = new THREE.Color('#fbd2d2');

// #region directions
const boxGeometry = new THREE.BoxGeometry( 1, 1, 1 );
const cube = new THREE.Mesh( boxGeometry, new THREE.MeshToonMaterial( { color: 0x00ff00 } ) );
const cubeR = new THREE.Mesh( boxGeometry, new THREE.MeshToonMaterial( { color: 0xff0000 } ) );
const cubeU = new THREE.Mesh( boxGeometry, new THREE.MeshToonMaterial( { color: 0x00ff00 } ) );
const cubeF = new THREE.Mesh( boxGeometry, new THREE.MeshToonMaterial( { color: 0x0000ff } ) );
cubeR.position.set(2,0,0);
cubeU.position.set(0,2,0);
cubeF.position.set(0,0,2);
scene.add( cube, cubeR, cubeU, cubeF );
// #endregion
// #region lights
const spotLight1:THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, Math.PI/2);
const spotLight2:THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, Math.PI/4);
spotLight1.position.set(1,1,1);
spotLight1.position.set(-1,-1,-1);
scene.add(spotLight1, spotLight2);
// #endregion


updateFrame();
function updateFrame() {
    requestAnimationFrame( updateFrame );
	renderer.render( scene, camera );
}


let gameBoard: THREE.Object3D;
const raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2()
let lastHovered: THREE.Object3D | null = null;
let remoteHover: THREE.Object3D | null = null;
function onMouseClick(){
    if(animating){
        return;
    }
    
    if(lastHovered==null || lastHovered.userData["tag"]!="btn"){
        return;
    }
    let coords: number[] = lastHovered.userData["group"];
    if(game!.cells[coords[0]][coords[1]].filedSides[lastHovered.userData.side]){
        return;
    }
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

window.addEventListener("resize", onWindowResize);
function onWindowResize(event: Event): void {
    camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}