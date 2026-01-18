import "@/App.css";
import { Room as ColyseusRoom } from "colyseus.js";
import { useEffect, useRef, useState } from "react";
import { GameSchema } from "../../../server/src/rooms/schema/Game";
import { useRoom } from "../components/ColyseusRoomContext";
import { Game } from "./Room/Game";
import { Lobby } from "./Room/Lobby";
interface RoomProps {
  goToHome: (message: string) => void;
}
export function Room({ goToHome }: RoomProps) {
  //   const [count, setCount] = useState(0)

  const { room, setRoom } = useRoom();
  if (!room) {
    window.location.href = "/";
    return <></>;
  }
  const gameRoom = room as ColyseusRoom<GameSchema>;
  const [showGame, setShowGame] = useState<Boolean>(gameRoom?.state?.started??false);
  console.log(showGame);
  const [gameId, setGameId] = useState<string>("");
  useEffect(() => {
    gameRoom.onStateChange((state) => {
      if (state.started){
        setShowGame(true);
      } 
      if(state.gameId){
        setGameId(state.gameId);
      }
    });
    gameRoom.onLeave((code, reason) => {
      setRoom(null);
      goToHome("Room closed!");
    });
    gameRoom.onError((code, reason) => {
      console.error(`Room error: ${code} (${reason})`);
    });
  }, [gameRoom]);

  return (
    <>
      {showGame ? (
        <Game key={gameId} gameRoom={gameRoom} leaveCallBack={()=>setShowGame(false)} />
      ) : (
        <Lobby gameRoom={gameRoom} />
      )}
    </>
  );
}
