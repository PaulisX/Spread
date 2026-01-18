export const SERVER_MESSAGES = ["board", "select_button"] as const;
export type ServerMessage = (typeof SERVER_MESSAGES)[number];
type ServerMessagePayload = {
	board: { boardId: string };
	select_button: { buttonId: number };
};

export const CLIENT_MESSAGES = [
	"request_board",
	"select_button",
	"start_game",
	"set_board_width",
	"set_board_height",
	"set_player_color"
] as const;
export type ClientMessage = (typeof CLIENT_MESSAGES)[number];
export type ClientMessagePayload = {
	request_board: {};
	select_button: { buttonId: number };
	set_board_width: { value:number };
	set_board_height: { value:number };
	set_player_color: {value:string};
};
