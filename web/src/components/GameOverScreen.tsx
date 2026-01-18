import type { Player } from "../../../server/src/rooms/schema/Player";
import type { PlayerStats } from "../models/PlayerStats";
import { PlayerStatsList } from "./PlayerStatsList";

export function GameOverScreen({players, playerStats, winnerId, lobbyBtnCallback}:GameOverScreenProps){
    const pStatsSorted = [...playerStats.entries()].sort(([aId,a],[bId,b])=>{
        if(a.turnsSurvived == 0) a.turnsSurvived = Number.MAX_SAFE_INTEGER; 
        if(b.turnsSurvived == 0) b.turnsSurvived = Number.MAX_SAFE_INTEGER; 
        const tDif = b.turnsSurvived - a.turnsSurvived;
        if(tDif!=0) return tDif;
        return aId.localeCompare(bId);
    })
    const playersSorted = pStatsSorted.map<Player>(([pId,pS])=>players.find(p=>p.id == pId)!);
    const winner = players.find(v=>v.id==winnerId)!;
    console.log(winner?.id);
    return(<>
        <div className="fixed flex flex-col items-center justify-center inset-0 backdrop-blur-sm">
            <div className="bg-background backdrop-blur-sm border-dark border-2 p-10 rounded-xl w-full sm:w-4/5 md:w-3/4 2xl:w-1/2 ">
                <h3 className="text-center">Winner</h3>
                <h2 className="text-center mb-10 text-outline " style={{color:winner.color}}>{winner.name}</h2>
                <PlayerStatsList players={playersSorted} playerStats={playerStats}/>
                <button onClick={lobbyBtnCallback} className="btn-md mt-4 color-primary shadow-md">Lobby</button>
            </div>
        </div>
    </>);
}
interface GameOverScreenProps {
  players: Player[];
  playerStats: Map<string, PlayerStats>;
  winnerId: string;
  lobbyBtnCallback: ()=>void;
}