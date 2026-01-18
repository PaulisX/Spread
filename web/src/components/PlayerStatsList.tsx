import { Player } from "../../../server/src/rooms/schema/Player";
import { PlayerStats } from "../models/PlayerStats";
import { PlayerItem } from "./PlayerItem";
export function PlayerStatsList({players, playerStats}: PlayerStatsProps){
    
    return(
        <>
            <ul className="text-2xl " style={{WebkitTextStrokeWidth:0.5}}>
                <li key="pstats-head" className="flex bg-light p-2 rounded-lg">
                    <div className="w-1/12 text-center"><b>Nr</b></div>
                    <div className="w-4/12 "><b>Name</b></div>
                    <div className="w-2/12 text-center"><b>Max cells</b></div>
                    <div className="w-2/12 text-center"><b>Max combo</b></div>
                    <div className="w-3/12 text-center"><b>Eliminated by</b></div>
                </li>
                {players.map((v,i)=><li key={v.id} className="flex bg-light p-2 rounded-lg mt-4" style={{color:v.color}}>
                    <div className="w-1/12 text-center">{i+1}.</div>
                    <div className="w-4/12 "><PlayerItem player={v}/></div>
                    <div className="w-2/12 text-center">{playerStats.get(v.id)?.maxCells}</div>
                    <div className="w-2/12 text-center">{playerStats.get(v.id)?.maxCombo}</div>
                    <div className="w-3/12 text-center">
                        {playerStats.get(v.id)?.eliminatedBy?
                            <div className="w-full h-full" style={{backgroundColor:players.find(p=>p.id == playerStats.get(v.id)!.eliminatedBy)?.color}}></div>
                            :<></>}
                    </div>
                </li>)}
            </ul>
        </>
    )
}
interface PlayerStatsProps {
  players: Player[];
  playerStats: Map<string, PlayerStats>;
}