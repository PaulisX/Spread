import { Player } from "../../../server/src/rooms/schema/Player";
import { PlayerItem } from "./PlayerItem";

export function PlayerList({players, keyPrefix, highlight}: {players: Player[], keyPrefix:string, highlight?: string}){
  return(
  <>
    <ul className='flex flex-col grow mb-8 gap-3 overflow-scroll no-scrollbar text-4xl' >
      {players.map((v)=>
        <li key={`${keyPrefix}-${v.id}`} ><PlayerItem player={v} style={{border:v.color, borderStyle:"solid", borderWidth: v.id==highlight?2:0}as React.CSSProperties}/></li>
      )}
    </ul>
  </>)
}