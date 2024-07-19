export class InterpolatedAnimation {
	readonly name: string;
	readonly onStart: (sharedProperties: any[]) => void;
	readonly onFinish: (sharedProperties: any[]) => void;
	readonly evaluate: (t: number, sharedProperties: any[]) => void;

	started = false;
	finished = false;

	protected startTime: number;
	protected duration: number;
	private sharedProperties: any[] = [];

	// constructor(
	// 	name: string,
	// 	duration: number,
	// 	evaluate: (t: number, sharedProperties: any[]) => void
	// );
	// constructor(
	// 	name: string,
	// 	duration: number,
	// 	evaluate: (t: number, sharedProperties: any[]) => void,
	// 	onStart: (sharedProperties: any[]) => void,
	// 	onFinish: (sharedProperties: any[]) => void
	// );
	// constructor(
	// 	name: string,
	// 	duration: number,
	// 	evaluate: (t: number, sharedProperties: any[]) => void,
	// 	onStart: () => void,
	// 	onFinish: () => void,
	// 	start: number
	// );

	constructor(
		duration: number,
		evaluate: (t: number, sharedProperties: any[]) => void,
		onStart?: (sharedProperties: any[]) => void,
		onFinish?: (sharedProperties: any[]) => void,
		start: number = Date.now(),
		name: string = ""
	) {
		this.name = name;
		this.evaluate = evaluate;
		this.onStart = onStart ?? ((sharedProperties: any[]) => void 0);
		this.onFinish = onFinish ?? ((sharedProperties: any[]) => void 0);
		this.startTime = start ?? Date.now();
		this.duration = duration;
	}
	public restart(execOnStart: boolean) {
		this.startTime = Date.now();
		if (execOnStart) this.started = false;
		this.finished = false;
	}
	public animate() {
		if (!this.started) {
			this.onStart(this.sharedProperties);
			this.started = true;
		}

		let t = (Date.now() - this.startTime) / this.duration;

		if (t >= 1) {
			this.onFinish(this.sharedProperties);
			this.finished = true;
			return;
		}

		this.evaluate(t, this.sharedProperties);
	}
}
