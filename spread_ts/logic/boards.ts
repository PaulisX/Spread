import { Cell } from "../models/Cell"
import { Button } from "../models/Button";
import type { Board } from "../models/Board";

export function squareBoard(width: number, height: number): Board{
  let cells: Cell[] = new Array<Cell>(width*height);// Map<number, Cell> = new Map();
  let buttons: Button[] = new Array<Button>(width*height*4);// Map<number, Button> = new Map();
  
  
  Array.from({ length: width * height }).forEach((_,v)=> {
    
    const btn0 = new Button(v*4+0,"free",v,(v+width)*4+2, new Uint16Array([v*4+1,v*4+3]));
    const btn1 = new Button(v*4+1,"free",v,(v+1)*4+3,     new Uint16Array([v*4+0,v*4+2]));
    const btn2 = new Button(v*4+2,"free",v,(v-width)*4,   new Uint16Array([v*4+1,v*4+3]));
    const btn3 = new Button(v*4+3,"free",v,(v-1)*4+1,     new Uint16Array([v*4+2,v*4+0]));
    const cell = new Cell(v, new Uint16Array([btn0.id, btn1.id, btn2.id, btn3.id]));
    cells[cell.id] =cell;
    buttons[btn0.id] =btn0;
    buttons[btn1.id] = btn1;
    buttons[btn2.id] = btn2;
    buttons[btn3.id] = btn3;
  });
  Array.from({length: width}).forEach((_,v)=>{
    let b = buttons[v*4+2]!;
    b.state = "disabled";
    b = buttons[(v+width*(height-1))*4]!;
    b.state = "disabled";
  });
  Array.from({length: height}).forEach((_,v)=>{
    let b = buttons[v * width * 4 + 3]!;
    b.state = "disabled";
    b = buttons[(v * width + width - 1)*4 + 1]!;
    b.state = "disabled";
  });
  
  return {
    cells: cells, 
    buttons: buttons
  }
}