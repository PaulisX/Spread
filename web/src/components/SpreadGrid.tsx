import type { Board } from "../../../spread_ts/models/Board"
import { Button as SButton} from "../../../spread_ts/models/Button"
import type { Cell } from "../../../spread_ts/models/Cell"

interface SpreadGridProps{
    width: number,
    height: number,
    gameBoard: Board,
    playerColors: Map<string,string>,
    clickCallback: (btnId:number)=>void
}
export function SpreadGrid({width, height, gameBoard, playerColors, clickCallback}:SpreadGridProps){

    return(
        <table>
            <tbody>
                {[...Array.from({ length:height})].map((_,_y)=>{
                    const y = height - 1 - _y
                    
                    let cells = [...Array.from({ length:width})].map((_,x)=>{
                        const cell = gameBoard.cells[y*width+x]!;
                        const btn0= gameBoard.buttons[cell.buttons[0]]!;
                        const btn1= gameBoard.buttons[cell.buttons[1]]!;
                        const btn2= gameBoard.buttons[cell.buttons[2]]!;
                        const btn3= gameBoard.buttons[cell.buttons[3]]!;
                        return(<td key={`cell-${x}-${y}`} style={{ outline: "1px solid red" }}>
                            <DrawCell cell={cell} btn0={btn0} btn1={btn1} btn2={btn2} btn3={btn3} x={x} y={y} playerColors={playerColors} clickCallback={clickCallback}/>
                        </td>)
                    })
                    return(<tr key={`row-${y}`}>{cells}</tr>)
                })}
            </tbody>
        </table>
    )
}
function DrawButton({btn, takenColor, clickCallback}:{btn:SButton, takenColor:string, clickCallback: ()=>void}){
    const color = btn.state=="taken"?takenColor:"black";
    return(
        <button style={{backgroundColor:color}} onClick={clickCallback}>{btn.id} ({btn.spreadsTo})</button>
        
    )
}
function DrawCell({cell,btn0,btn1,btn2,btn3,x,y, playerColors,clickCallback}:{cell: Cell, btn0: SButton, btn1: SButton, btn2: SButton, btn3: SButton, x:number, y: number, playerColors: Map<string,string>, clickCallback:(btnId:number)=>void}){
    const color = cell.takenBy == undefined || cell.takenBy == ""
        ? "#ffffff"
        : playerColors.get(cell.takenBy)??"#ffffffff";
    return(
        <table><tbody>
            <tr key={`cellR-${x}-${y}-0`}><td key={`cellC-${x}-${y}-0-0`}></td><td key={`cellC-${x}-${y}-0-1`}>{btn0?.state=="disabled"?"":<DrawButton btn={btn0} takenColor={color} clickCallback={()=>clickCallback(btn0.id)}/>}</td><td key={`cellC-${x}-${y}-0-2`}></td></tr>
            <tr key={`cellR-${x}-${y}-1`}><td key={`cellC-${x}-${y}-1-0`}>{btn3?.state=="disabled"?"":<DrawButton btn={btn3} takenColor={color} clickCallback={()=>clickCallback(btn3.id)}/>}</td><td  key={`cellC-${x}-${y}-1-1`} style={{color:"red"}}><b>{cell.id}</b></td><td key={`cellC-${x}-${y}-1-2`}>{btn1?.state=="disabled"?"":<DrawButton btn={btn1} takenColor={color} clickCallback={()=>clickCallback(btn1.id)}/>}</td></tr>
            <tr key={`cellR-${x}-${y}-2`}><td key={`cellC-${x}-${y}-2-0`}></td><td key={`cellC-${x}-${y}-2-1`}>{btn2?.state=="disabled"?"":<DrawButton btn={btn2} takenColor={color} clickCallback={()=>clickCallback(btn2.id)}/>}</td><td key={`cellC-${x}-${y}-2-2`}></td></tr>
        </tbody></table>
    )
}