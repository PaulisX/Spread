import { Client, ISendOptions } from "colyseus";

export function sendTyped<MessageType extends string | number>(
	client: Client,
	type: MessageType,
	message?: any,
	options?: ISendOptions
): void {
	return client.send(type, message, options);
}
