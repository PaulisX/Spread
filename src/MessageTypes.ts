export abstract class ClientMessageTypes{
    static LobbyMemberList: number = 0;
    static PlayerJoinedLobby: number = 1;
    static PlayerLeftLobby: number = 2;
    static StartGame: number = 3;
    static HoverBtn: number = 4;
    static PerformTurn: number=5;
}
export abstract class ServerMessageTypes{
    static GetLobbyMemberList: number = 0;
    static PlayerJoinedLobby: number = 1;
    static PlayerLeftLobby: number = 2;
    static StartGame: number = 3;
    static HoverBtn: number = 4;
}