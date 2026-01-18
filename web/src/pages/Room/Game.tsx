import { useEffect, useRef, useState } from "react";
import type { GameSchema } from "../../../../server/src/rooms/schema/Game";
import { Room as ColyseusRoom } from "colyseus.js";
import { Game as SpreadGame } from "../../../../spread_ts/logic/game";
import { PlayerStats } from "../../models/PlayerStats";
import { squareBoard } from "../../../../spread_ts/logic/boards";
import type { GameTurn } from "../../../../server/src/rooms/schema/GameTurn";
import { PlayerList } from "../../components/PlayerList";
import { PlayerStatsList } from "../../components/PlayerStatsList";
import { SpreadGrid } from "../../components/SpreadGrid";
import { GameOverScreen } from "../../components/GameOverScreen";

interface GameProps {
  gameRoom: ColyseusRoom<GameSchema>;
  leaveCallBack: ()=> void;
}
export function Game({ gameRoom, leaveCallBack }: GameProps) {
  const [turnIndex, setTurnIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [canMove, setCanMove] = useState(false);
  const game = useRef<SpreadGame>(
    new SpreadGame(
      squareBoard(
        gameRoom.state.gameSettings.width,
        gameRoom.state.gameSettings.height,
      ),
    ),
  );

  const playerStats = useRef<Map<string, PlayerStats>>(new Map());
  const [playersArray, setPlayersArray] = useState(
    Array.from(
      gameRoom
        .state!.gameSettings.turnOrder.map(
          (id) => gameRoom.state.players.get(id)!,
        )
        .values(),
    ),
  );
  const [currentTurn, setCurrentTurn] = useState("");
  const [tabHeld, setTabHeld] = useState<Boolean>(false);
  const [winnerId, setWinnerId] = useState<string|undefined>(undefined);

  useEffect(() => {
    playersArray.forEach((v) =>
      playerStats.current.set(v.id, new PlayerStats()),
    );
    nextTurn();
    gameRoom.onStateChange((state) => {
      if (gameRoom.state.players.size != playersArray.length) {
        let newPlayers = [...gameRoom.state.players.values()].filter(
          (nv) => !playersArray.some((v) => nv.id == v.id),
        );
        newPlayers.forEach((p) =>
          playerStats.current.set(p.id, new PlayerStats()),
        );
        setPlayersArray(
          Array.from(
            gameRoom
              .state!.gameSettings.turnOrder.map(
                (id) => gameRoom.state.players.get(id)!,
              )
              .values(),
          ),
        );
      }
      handleTurnHistoryUpdte(state);
    });

    const downHandler = createDownHandler(setTabHeld);
    const upHandler = createUpHandler(setTabHeld);
    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, [gameRoom]);
  function handleTurnHistoryUpdte(state: GameSchema){
    const turnLag = state.turnHistory.length - game.current.turnCounter;
      setCanMove(turnLag==0);
      const coughtUp = ()=>{
        const winner = game.current.getWinner();
        if(winner){
          setWinnerId(game.current.getWinner());
        } else{
          nextTurn();
        }
      }
      if (turnLag > 1) {
        applyTurns(state.turnHistory.slice(game.current.turnCounter, turnLag));
        setTurnIndex(game.current.turnCounter);
        setStepIndex(0);
        coughtUp();
      } else if (turnLag == 1) {
        animateTurn(state.turnHistory.at(-1)).finally(() => {
          coughtUp();
        });
      }
  }
  function animateTurn(turn: GameTurn): Promise<void> {
    return new Promise<void>((resolve) => {
      game.current.selectButton(turn.buttonId, turn.playerId);
      let cellCnt = game.current.board.cells.reduce(
        (n, v) => (v.takenBy == turn.playerId ? n + 1 : n),
        0,
      );
      if (cellCnt > playerStats.current.get(turn.playerId)!.maxCells)
        playerStats.current.get(turn.playerId)!.maxCells = cellCnt;
      setTurnIndex(game.current.turnCounter);
      setStepIndex(0);
      let explosionCount = -1;
      const intervalToken = window.setInterval(() => {
        if (!game.current.fullCells.some(() => true)) {
          window.clearInterval(intervalToken);
          resolve();
          return;
        } else {
          game.current.explodeCells();
          explosionCount++;
          updatePlayerStats(
            turn.playerId,
            playerStats.current,
            explosionCount,
            game.current,
          );
          setStepIndex((prev) => prev + 1);
        }
      }, 1000);
    });
  }

  function applyTurns(turns: GameTurn[]) {
    turns.forEach((turn) => {
      game.current.selectButton(turn.buttonId, turn.playerId);
      let explosionCount = 0;
      while (game.current.fullCells.some(() => true)) {
        game.current.explodeCells();
        explosionCount++;
        updatePlayerStats(
          turn.playerId,
          playerStats.current,
          explosionCount,
          game.current,
        );
      }
    });
  }
  function nextTurn() {
    const nextPlayer = findNextPlayer(gameRoom);
    const canMv = nextPlayer == gameRoom.sessionId;
    setCurrentTurn(nextPlayer);
    setCanMove(canMv);
  }

  const playerColors: Map<string, string> = new Map(
    [...gameRoom.state.players.entries()].map(([id, player]) => [
      id,
      player.color,
    ]),
  );
  function onButtonClicked(btnId: number) {
    if (!canMove) return;
    if (!game.current.canSelectButton(btnId, gameRoom.sessionId)) return;
    gameRoom.send("select_button", { buttonId: btnId });
  }
  function Overlay(){
    let overlay = <></>;
    if(winnerId){
      overlay = 
      // <div className="mx-auto sm:w-3/4 md:w-3/4 fixed inset-x-0 top-10 pointer-events-none">
          <GameOverScreen lobbyBtnCallback={leaveCallBack} players={playersArray} playerStats={playerStats.current} winnerId={winnerId}/>
        // </div>
    } else{
      overlay = <>
        <PlayerListSidebar/>
        <PlayerStatListOverlay/>
      </>
    } 
    return (overlay);
  }
  function PlayerListSidebar(){
    return (
      <div className="fixed w-1/4 md:w-1/5 2xl:min-w-96 xl:min-w-72 xl:w-auto h-full bg-none pointer-events-none">
        <div className="flex flex-column w-full h-full items-center m-0">
          <PlayerList
            players={playersArray}
            keyPrefix="gamePlayer"
            highlight={currentTurn}
          />
        </div>
      </div>
    )
  }
  function PlayerStatListOverlay(){
    if(!tabHeld) return;
    return (
      <div className="mx-auto sm:w-3/4 md:w-3/4 fixed inset-x-0 top-10 pointer-events-none">
        <PlayerStatsList
          players={playersArray}
          playerStats={playerStats.current}
        />
      </div>);
  }
  return (
    <>
      <Overlay/>
      {/* <PlayerListSidebar /> */}

      <div className="text-base flex items-center justify-center h-screen">
        <SpreadGrid
          key={`${turnIndex}-${stepIndex}`}
          width={gameRoom.state.gameSettings.width}
          height={gameRoom.state.gameSettings.height}
          gameBoard={game.current.board}
          playerColors={playerColors}
          clickCallback={onButtonClicked}
        ></SpreadGrid>
      </div>
    </>
  );
}
function findNextPlayer(gameRoom: ColyseusRoom<GameSchema>): string {
  let nextPlayer = "";
  if (
    gameRoom.state.gameSettings &&
    gameRoom.state.players &&
    gameRoom.state.turnHistory
  ) {
    if (gameRoom.state.turnHistory.some((_) => true)) {
      let lastPlayer = gameRoom.state.turnHistory.at(-1).playerId;
      console.log(`lastP: ${lastPlayer}`);
      let index = gameRoom.state.gameSettings.turnOrder.findIndex(
        (v) => v == lastPlayer,
      )!;
      nextPlayer = gameRoom.state.gameSettings.turnOrder.at(
        (index + 1) % gameRoom.state.gameSettings.turnOrder.length,
      );
    } else {
      nextPlayer = gameRoom.state.gameSettings.turnOrder.at(0);
    }
  }
  return nextPlayer;
}
function createDownHandler(
  setTabHeld: (value: boolean) => void,
): (ev: KeyboardEvent) => void {
  return (ev: KeyboardEvent) => {
    if (ev.key === "Tab") {
      ev.preventDefault();
      setTabHeld(true);
    }
  };
}

function createUpHandler(
  setTabHeld: (value: boolean) => void,
): (ev: KeyboardEvent) => any {
  return (ev: KeyboardEvent) => {
    if (ev.key === "Tab") {
      ev.preventDefault();
      setTabHeld(false);
    }
  };
}
function updatePlayerStats(
  pid: string,
  pStats: Map<string, PlayerStats>,
  explosionCount: number,
  game: SpreadGame,
) {
  const cpStats = pStats.get(pid)!;

  // update MaxCells
  const cellCnt = game.board.cells.reduce(
    (n, v) => (v.takenBy == pid ? n + 1 : n),
    0,
  );
  if (cellCnt > cpStats.maxCells) cpStats.maxCells = cellCnt;

  // Update MaxChain
  if (explosionCount > cpStats.maxCombo) cpStats.maxCombo = explosionCount;

  // Upadate EliminatedBy for others
  const alivePlayers = new Set(game.board.cells.map((c) => c.takenBy));
  alivePlayers.delete(undefined);
  alivePlayers.delete("");

  const eliminatedPlayers: Set<string> = new Set();
  [...pStats.entries()].forEach(([pid, pStats]) => {
    if (!pStats.eliminatedBy && !alivePlayers.has(pid))
      eliminatedPlayers.add(pid);
  });
  eliminatedPlayers.forEach((pId) => {
    pStats.get(pId)!.eliminatedBy = pid;
    pStats.get(pId)!.turnsSurvived = game.turnCounter;
});
}
