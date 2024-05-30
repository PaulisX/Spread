export abstract class ClientMessageTypes{
    static GetLobbyMemberList: number = 0;
    // static PlayerJoinedLobby: number = 1;
    // static PlayerLeftLobby: number = 2;
    static StartGame: number = 1;
    static HoverBtn: number = 2;
    static PerformTurn: number= 3;
}
export abstract class ServerMessageTypes{
    static LobbyMemberList: number = 0;
    static PlayerJoinedLobby: number = 1;
    static PlayerLeftLobby: number = 2;
    static StartGame: number = 3;
    static HoverBtn: number = 4;
    static PerformTurn: number=5;
}