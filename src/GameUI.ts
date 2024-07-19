import {
	BoxGeometry,
	Material,
	Mesh,
	MeshToonMaterial,
	Object3D,
	Scene,
} from "three";
import { GameBoard } from "@/Models/Game";
import { int } from "three/examples/jsm/nodes/Nodes.js";
import { Geometry } from "three/examples/jsm/deprecated/Geometry.js";
import EventEmitter from "eventemitter3";
import { ClientData } from "@/Networking/Models/ClientData";
import { Client } from "./Networking/Client";
import { InterpolatedAnimation } from "./InterpolatedAnimation";

export class GameUI {
	static colors = [
		0x66991a, 0xb34d4d, 0x9900b3, 0x4db3ff, 0x4d8066, 0xffb399, 0x80b300,
		0x809900, 0xe6b3b3, 0x6680b3, 0x999966, 0xff99e6, 0xccff1a, 0xff1a66,
		0xe6331a, 0x33ffcc, 0x66994d, 0xb366cc, 0x4d8000, 0xb33300, 0xcc80cc,
		0x66664d, 0x991aff, 0xe666ff, 0x1ab399, 0xe666b3, 0x33991a, 0xcc9999,
		0xb3b31a, 0x00e680, 0x809980, 0xe6ff80, 0x1aff33, 0x999933, 0xff3380,
		0xcccc00, 0x66e64d, 0x4d80cc, 0xe64d66, 0x4db380, 0xff4d4d, 0x99e6e6,
		0x6666ff,
	];

	readonly events: EventEmitter = new EventEmitter();
	readonly explosionCounterSize = 64;
	connectUi: HTMLElement = document.getElementById("connectUi")!;
	connectUiForm: HTMLFormElement = document.getElementById(
		"actionForm"
	) as HTMLFormElement;

	lobbyUi: HTMLElement = document.getElementById("lobbyUi")!;
	lobbyUiMembers: HTMLElement = document.getElementById("lobbyMembers")!;
	lobbyUiCopyCodeBtn: HTMLButtonElement = (<HTMLButtonElement>(
		document.getElementById("cpyJoinCodeBtn")
	))!;
	lobbyUiStartGameBtn: HTMLButtonElement = (<HTMLButtonElement>(
		document.getElementById("startGameBtn")
	))!;

	gameUi: HTMLElement = document.getElementById("gameUi")!;
	gameUiMembers: HTMLElement = document.getElementById("gameMembers")!;
	gameUiChainCounter: HTMLElement = document.getElementById("chainCounter")!;
	//Game over
	gameUiGoScreen: HTMLElement = document.getElementById("gameOverScreen")!;
	gameUiGoText: HTMLElement = document.getElementById("winnerText")!;

	constructor() {
		this.lobbyUi.style.display = "none";
		this.gameUi.style.display = "none";
		this.connectUi.style.display = "block";

		let queryString = window.location.search;
		let urlParams = new URLSearchParams(queryString);
		let joinCode = urlParams.get("joinCode");
		if (joinCode) {
			(<HTMLInputElement>document.getElementById("homeUiHostId")).value =
				joinCode;
		}

		this.connectUiForm.addEventListener("submit", (ev: SubmitEvent) => {
			ev.preventDefault();
			const data: FormData = new FormData(ev.target as HTMLFormElement);
			let username = data.get("username")?.toString();
			if (!username) {
				console.error("Failed to read username");
				return;
			}
			if ((<HTMLInputElement>ev.submitter).value == "host")
				this.events.emit("host", username);
			else {
				let joinCode = data.get("hostId")?.toString();
				if (!username) {
					console.error("Failed to read joincode");
					return;
				}
				this.events.emit("join", joinCode, username);
			}
		});
	}
	setWorldCanvas(canvas: HTMLCanvasElement) {
		document.body.appendChild(canvas);
	}
	showLobby(joinCode: string, isHost: boolean = false) {
		this.connectUi.style.display = "none";
		this.gameUi.style.display = "none";
		this.lobbyUi.style.display = "block";
		history.replaceState({ page: 1 }, "room", `?joinCode=${joinCode}`);
		// set copy join code button
		this.lobbyUiCopyCodeBtn.addEventListener("click", (e: MouseEvent) => {
			navigator.clipboard.writeText(joinCode);
		});
		if (isHost) {
			this.lobbyUiStartGameBtn.style.display = "block";
			this.lobbyUiStartGameBtn.addEventListener("click", (e: MouseEvent) => {
				this.events.emit("startGame");
			});
		}
	}
	setLobbyMemembers(clients: ClientData[]) {
		let memberListStr = "";
		clients.forEach((client) => {
			memberListStr += `<li style="display: flex;  flex-direction: row;align-content: flex-end;" id="l-pid-${client.id}"><img src="./vite.svg" style="padding-right:10px;"><h3>${client.username}</h3></li>`;
		});
		this.lobbyUiMembers.innerHTML = memberListStr;
	}

	showGame() {
		this.connectUi.style.display = "none";
		this.lobbyUi.style.display = "none";
		this.gameUi.style.display = "block";
	}
	setGameMemberList(clients: ClientData[]) {
		let memberListStr = "";
		clients.forEach((client) => {
			memberListStr += `<li style="display: flex;  flex-direction: row;align-content: flex-end;" id="l-pid-${client.id}"><img src="./vite.svg" style="padding-right:10px;"><h3>${client.username}</h3></li>`;
		});
		this.gameUiMembers.innerHTML = memberListStr;
	}
	setCurrentActivePlayer(client: ClientData) {}

	counterAmination: InterpolatedAnimation = new InterpolatedAnimation(
		1500,
		(t) => {
			this.setExplosionCounterSize(1 - t);
		},
		() => {},
		() => {
			this.setExplosionCounter(0);
		},
		Date.now(),
		"explosionCounter"
	);
	setExplosionCounter(number: number, color?: number, size: number = 1) {
		let text = "";
		this.setExplosionCounterSize(size);
		if (number > 0) text = `${number}x`;
		this.gameUiChainCounter.innerHTML = text;
		if (color) this.gameUiChainCounter.style.color = `#${color.toString(16)}`;
		this.counterAmination?.restart(false);
		if (
			!this.animations.find((v) => {
				return v.name == this.counterAmination.name;
			})
		)
			this.addAnimation(this.counterAmination);
	}
	private setExplosionCounterSize(size: number) {
		this.gameUiChainCounter.style.scale = `${size}`;
	}
	gameOver(client: ClientData) {
		this.gameUiGoScreen.style.display = "block";
		this.gameUiGoText.innerHTML = client.username;
	}

	private animations: InterpolatedAnimation[] = [];
	public addAnimation(animation: InterpolatedAnimation) {
		this.animations.push(animation);
	}
	private animate() {
		for (let i = 0; i < this.animations.length; i++) {
			let animation: InterpolatedAnimation = this.animations[i]!;
			animation.animate();
			if (animation.finished) {
				this.animations.splice(i, 1);
			}
		}
	}

	public updateFrame() {
		this.animate();
	}
}
