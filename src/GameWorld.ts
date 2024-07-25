import * as THREE from "three";
import { Mesh, Object3D, MeshToonMaterial, BufferGeometry } from "three";
import { OrbitControls } from "three/addons";
import { InterpolatedAnimation } from "./InterpolatedAnimation.js";
import { GameBoard } from "./Models/Game.js";
import EventEmitter from "eventemitter3";
import { delay } from "./Utils/Delay.js";
import { Cell } from "./Models/Cell.js";
import { CellButtonValue } from "./Models/CellButtonValue.js";
import { string } from "three/examples/jsm/nodes/Nodes.js";

export class GameWorld {
	private renderer = new THREE.WebGLRenderer();
	private scene = new THREE.Scene();
	private camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
	private orbitControls = new OrbitControls(
		this.camera,
		this.renderer.domElement
	);
	private raycaster = new THREE.Raycaster();

	public animations: InterpolatedAnimation[] = [];

	private gameBoardBtns: (Mesh | undefined)[][][] = [];
	private gameBoardBtnParrent?: Object3D | undefined;
	private gameBoardPad: Mesh = new Mesh();

	readonly events: EventEmitter = new EventEmitter();

	constructor() {
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.camera.position.z = 5;
		this.orbitControls.target.set(
			(0.5 * 1 + 0.5 * 4 + 3) * 2 + (0.5 * 0 + 0.5 * 2 + 1.5),
			0,
			(0.5 * 1 + 0.5 * 4 + 3) * 2 + (0.5 * 0 + 0.5 * 2 + 1.5)
		);
		this.scene.background = new THREE.Color("#fbd2d2");

		//Events
		window.addEventListener("resize", () => {
			this.onWindowResize();
		});
		this.renderer.domElement.addEventListener("mousedown", (e) => {
			this.onMouseClick(e);
		});

		// Lights
		let spotLight1: THREE.DirectionalLight = new THREE.DirectionalLight(
			0xffffff,
			Math.PI / 2
		);
		let spotLight2: THREE.DirectionalLight = new THREE.DirectionalLight(
			0xffffff,
			Math.PI / 4
		);
		// spotLight1.position.set(1, 1, 1);
		spotLight1.position.set(-1, -1, -1);
		this.scene.add(spotLight1, spotLight2);

		//Update frame
		this.updateFrame();
	}

	public getCanvas(): HTMLCanvasElement {
		return this.renderer.domElement;
	}
	public onMouseMove(event: MouseEvent) {
		// event.preventDefault();
		let mousePosition = new THREE.Vector2(
			(event.clientX / window.innerWidth) * 2 - 1,
			-(event.clientY / window.innerHeight) * 2 + 1
		);

		this.raycaster.setFromCamera(mousePosition, this.camera);
		var intersects = this.raycaster.intersectObject(this.scene, true);

		if (intersects.length <= 0) {
			return;
		}
		let foundObj: Object3D = intersects[0]!.object;
		//TODO: Reimplement hover logic
	}
	onMouseClick(event: MouseEvent) {
		let mousePosition = new THREE.Vector2(
			(event.clientX / window.innerWidth) * 2 - 1,
			-(event.clientY / window.innerHeight) * 2 + 1
		);

		this.raycaster.setFromCamera(mousePosition, this.camera);
		var intersects = this.raycaster.intersectObject(this.scene, true);

		if (intersects.length == 0) {
			return;
		}
		let foundObj: Object3D = intersects[0]!.object;
		if (!foundObj.userData["tag"] || foundObj.userData["tag"] != "btn") {
			return;
		}
		this.events.emit("clickBtn", [
			foundObj.userData["group"][0],
			foundObj.userData["group"][1],
			foundObj.userData["side"],
		]);
	}
	colorCell(x: number, y: number, side: number, color: number) {
		let m = this.gameBoardBtns[x]![y]![side]!.material as MeshToonMaterial;
		m.color.setHex(color);
	}
	async explodeCells(cells: Cell[], pColor: number, updatedCells?: Cell[]) {
		let startTime = Date.now();
		let animationLength = 750;
		console.log(JSON.stringify(cells));
		for (let cell of cells) {
			for (let i = 0; i < 4; i++) {
				let fromBtn = this.gameBoardBtns[cell.x]?.[cell.y]?.[i];
				if (fromBtn == undefined) {
					console.warn("From button undefined!");
					continue;
				}
				console.log(cell, fromBtn, i);
				(fromBtn.material as MeshToonMaterial).color.setHex(0xeaf7ff);
				let onStart = (sharedProperties: any[]) => {
					let m = new Mesh(
						new THREE.BoxGeometry(1, 1, 1),
						new MeshToonMaterial({
							color: pColor,
						})
					);
					m.position.set(fromBtn.position.x, 1, fromBtn.position.z);
					sharedProperties.push(m);
					this.scene.add(m);
				};

				let cellX = cell.x;
				let cellY = cell.y;
				if (i == 0) cellY -= 1;
				else if (i == 1) cellX += 1;
				else if (i == 2) cellY += 1;
				else if (i == 3) cellX -= 1;

				let toBtnSide = (i + 2) % 4;
				let toBtn = this.gameBoardBtns[cellX]?.[cellY]?.[toBtnSide];
				if (toBtn == undefined) {
					console.warn(
						`To button undefined! ${cellX}, ${cellY}, ${toBtnSide}`
					);
					console.log(this.gameBoardBtns[cellX]?.[cellY]);
					continue;
				}
				let onFinish = (sharedProperties: any[]) => {
					this.scene.remove(sharedProperties[0]);
					(toBtn.material as MeshToonMaterial).color.setHex(pColor);
					console.log("finish!");
				};

				let from: number[] = [fromBtn.position.x, 1, fromBtn.position.z];
				let to: number[] = [toBtn.position.x, 1, toBtn.position.z];
				let evaluate = (t: number, sharedProperties: any[]) => {
					console.log("eval");
					sharedProperties[0].position.set(
						from[0]! + (to[0]! - from[0]!) * t,
						from[1]! +
							(to[1]! - from[1]!) * t +
							-Math.pow(t * 2 - 1, 2) +
							1,
						from[2]! + (to[2]! - from[2]!) * t
					);
				};
				console.log("Add animation!");
				this.addAnimation(
					new InterpolatedAnimation(
						animationLength,
						evaluate,
						onStart,
						onFinish,
						startTime
					)
				);
			}
		}
		await delay(750);
		updatedCells?.forEach((cell) => {
			for (let i = 0; i < 4; i++) {
				if (cell.buttons[i] == CellButtonValue.Disabled) continue;
				let btn = this.gameBoardBtns[cell.x]?.[cell.y]?.[i];
				if (btn == undefined)
					throw TypeError(
						`Button [${cell.x},${cell.x},${i}] is undefined!`
					);
				let hexColor = 0xeaf7ff;
				if (cell.buttons[i] == CellButtonValue.Occupied) hexColor = pColor;
				(btn!.material as MeshToonMaterial).color.setHex(hexColor);
			}
		});
		await delay(100);
	}
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
	createGameboard(game: GameBoard, colors: number[]) {
		this.gameBoardBtns.length = 0;
		if (this.gameBoardBtnParrent) {
			this.scene.remove(this.gameBoardBtnParrent);
			this.gameBoardBtnParrent = undefined;
		}
		let btns = new Object3D();
		let defaultColor = 0xeaf7ff;
		let btnSize = 1;
		let btnMargin = 0.5;
		let btnGroupMargin = 0.5;
		let btnGeometry = new THREE.BoxGeometry(1, 1, 1);
		this.gameBoardBtns = [];
		this.gameBoardBtns = new Array<Mesh[][]>(game.getBoardWidth());
		for (let x = 0; x < game.getBoardWidth(); x++) {
			this.gameBoardBtns[x] = new Array<Mesh[]>(game.getBoardLength());
			for (let y = 0; y < game.getBoardLength(); y++) {
				this.gameBoardBtns[x]![y] = new Array<Mesh>(4);
				let cell = game.cells[x]![y]!;
				let color: number =
					cell.owner == -1 ? defaultColor : colors[cell.owner]!;
				let btnGroupPosX =
					(btnSize * 3 + btnMargin * 4 + btnGroupMargin) * x;
				let btnGroupPosY =
					(btnSize * 3 + btnMargin * 4 + btnGroupMargin) * y;
				if (cell.buttons[0] != CellButtonValue.Disabled) {
					let btn = this.createBtn(
						btnGroupPosX + btnSize + btnMargin * 2 + btnSize / 2,
						btnGroupPosY + btnMargin + btnSize / 2,
						[x, y],
						0,
						cell.buttons[0] ? color : defaultColor,
						btnSize,
						btnGeometry
					);
					btns.add(btn);
					this.gameBoardBtns[x]![y]![0] = btn;
				}
				if (cell.buttons[1] != CellButtonValue.Disabled) {
					let btn = this.createBtn(
						btnGroupPosX + btnSize * 2 + btnMargin * 3 + btnSize / 2,
						btnGroupPosY + btnSize + btnMargin * 2 + btnSize / 2,
						[x, y],
						1,
						cell.buttons[1] ? color : defaultColor,
						btnSize,
						btnGeometry
					);
					btns.add(btn);
					this.gameBoardBtns[x]![y]![1] = btn;
				}
				if (cell.buttons[2] != CellButtonValue.Disabled) {
					let btn = this.createBtn(
						btnGroupPosX + btnSize + btnMargin * 2 + btnSize / 2,
						btnGroupPosY + btnSize * 2 + btnMargin * 3 + btnSize / 2,
						[x, y],
						2,
						cell.buttons[2] ? color : defaultColor,
						btnSize,
						btnGeometry
					);
					btns.add(btn);
					this.gameBoardBtns[x]![y]![2] = btn;
				}
				if (cell.buttons[3] != CellButtonValue.Disabled) {
					let btn = this.createBtn(
						btnGroupPosX + btnMargin + btnSize / 2,
						btnGroupPosY + btnSize + btnMargin * 2 + btnSize / 2,
						[x, y],
						3,
						cell.buttons[3] ? color : defaultColor,
						btnSize,
						btnGeometry
					);
					btns.add(btn);
					this.gameBoardBtns[x]![y]![3] = btn;
				}
			}
		}
		this.gameBoardBtnParrent = btns;
		this.scene.add(this.gameBoardBtnParrent);
	}
	private createBtn(
		x: number,
		y: number,
		group: number[],
		side: number,
		color: number,
		size: number,
		geometry: BufferGeometry
	): Mesh {
		let m = new Mesh(geometry, new MeshToonMaterial({ color: color }));
		m.position.set(x, 0, y);
		m.scale.set(size, size, size);
		m.userData["tag"] = "btn";
		m.userData["group"] = group;
		m.userData["side"] = side;
		return m;
	}
	public updateFrame() {
		this.animate();
		this.renderer.render(this.scene, this.camera);
	}
	private onWindowResize(): void {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}
}
