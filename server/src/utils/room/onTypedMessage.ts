import { Client, Room } from "colyseus";

export function onTypedMessage<
	MessageType extends string | number,
	PayloadType = any
>(
	room: Room,
	messageType: MessageType,
	callback: (client: Client, message: PayloadType) => void,
	validate?: (message: unknown) => PayloadType
): any {
	return room.onMessage(messageType, callback, validate);
}
