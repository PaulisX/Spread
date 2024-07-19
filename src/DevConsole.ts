export class DevConsole {
	// 0: function
	// 1: Description
	// 2: Parameter explanations
	static functions: Map<string, [(...params: any) => any, string, string]> =
		new Map();

	public static call(func: string, ...params: any) {
		if (!this.functions.has(func)) {
			console.error(`Function '${func}' does not exist!`);
			return;
		}
		this.functions.get(func)![0](params);
	}
	public static help(func?: string) {
		if (!func) {
			let str = "";
			for (let f of this.functions.keys()) {
				str += f + ", ";
			}
			return str;
		}

		if (!this.functions.has(func)) {
			console.error(`Function '${func}' does not exist!`);
			return;
		}
		let f = this.functions.get(func)!;
		console.info(f[1]);
		console.info(f[2]);
	}

	public static addFunction(
		name: string,
		func: (...params: any) => any,
		description: string = "",
		params: string = ""
	) {
		if (this.functions.has(name)) {
			console.error(`Function ${name} already has been added!`);
			return;
		}
		this.functions.set(name, [func, description, params]);
	}
	public static removeFunction(name: string, func: (...params: any) => any) {
		if (!this.functions.has(name)) {
			console.error(`Function ${name} does not exist!`);
			return;
		}
		this.functions.delete(name);
	}
}

declare global {
	interface Window {
		Spread: DevConsole;
	}
}
window.Spread = window.Spread;
window.Spread = DevConsole;
