import { Player } from "../../../server/src/rooms/schema/Player";

export function PlayerItem({player, style}: {player: Player, style?: React.CSSProperties}){
  return(
    <div className='player' style={{...style, "--indicator-color":player.color}as React.CSSProperties}>
        {player.name}
    </div>
  )
}