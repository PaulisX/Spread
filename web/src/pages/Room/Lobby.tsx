import { Room as ColyseusRoom } from "colyseus.js";
import { useEffect, useState } from "react";
import type { GameSchema } from "../../../../server/src/rooms/schema/Game";
import type { Player } from "../../../../server/src/rooms/schema/Player";
import spreadBanner from "/logo-wide.png";
import { PlayerList } from "../../components/PlayerList";
import { InputNumber } from "../../components/InputNumber";

export function Lobby({ gameRoom }: { gameRoom: ColyseusRoom<GameSchema> }) {
  const colorList: string[] = [
    "#EB5E55",
    "#ebaa55",
    "#e1eb55",
    "#96eb55",
    "#55eb5f",
    "#19d785",
    "#55e1eb",
    "#5596eb",
    "#5f55eb",
    "#aa55eb",
    "#eb55e1",
    "#eb5596",
  ];
  const [lobbySettingsView, setlobbySettingsView] = useState<"player" | "game">(
    "player"
  );
  const [playersArray, setPlayersArray] = useState<Player[]>(Array.from(gameRoom.state?.players?.values() || []));
  const [boardSize, setBoardSize] = useState<{ w: number; h: number }>({
    w: gameRoom.state?.gameSettings?.width ?? 5,
    h: gameRoom.state?.gameSettings?.height ?? 5,
  });
  const [playerColor, setPlayerColor] = useState(colorList[0]);
  useEffect(() => {
    gameRoom.onStateChange((state) => {
      if (state.players) {
        setPlayersArray(Array.from(gameRoom.state?.players?.values() || []));
        setPlayerColor(
          gameRoom.state.players.get(gameRoom.sessionId)?.color ?? ""
        );
      }
    });
  }, [gameRoom]);

  return (
    <>
      <div className="h-screen p-8">
        <div className="h-1/5  flex justify-center items-center">
          <div className="flex flex-col">
            <img src={spreadBanner}></img>
            <h3 className="text-center">Game is under development!</h3>
          </div>
        </div>
        <div className="h-4/5 flex">
          <div className="flex md:flex-row grow">
            <div className="w-full md:w-1/3 flex">
              <div className="m-8 grow flex flex-col">
                <div className="rounded-lg bg-darken-10 outline-dark min-h-10 bg-opacity-10 p-8 mb-4 grow flex flex-col">
                  <h3 className="text-primary">Players</h3>
                  <PlayerList
                    players={playersArray}
                    keyPrefix="lobbyPlayer"
                    highlight=""
                  />
                </div>
                <button
                  className="m-0 btn-lg"
                  onClick={async () => {
                    try {
                      await gameRoom?.leave();
                      window.location.href = "/";
                    } catch (ex) {
                      console.error(ex);
                    }
                  }}
                >
                  Leave
                </button>
              </div>
            </div>
            <div className="w-full md:w-2/3 flex flex-col p-8">
              <div className="flex gap-8">
                <button
                  onClick={() => setlobbySettingsView("player")}
                  className={`py-2 text-5xl w-full rounded-t-xl m-0 rounded-t-10 bg-darken-10 ${lobbySettingsView == "player" ? "bg-darken-10" : "bg-darken-5"}`}
                >
                  Player settings
                </button>
                <button
                  onClick={() => setlobbySettingsView("game")}
                  className={`py-2 text-5xl w-full rounded-t-xl m-0 rounded-b-none bg-darken-10 ${lobbySettingsView == "game" ? "bg-darken-10" : "bg-darken-5"}`}
                >
                  Game settings
                </button>
              </div>
              <div className="rounded-b-lg bg-darken-10 outline-dark min-h-10 bg-opacity-10 p-8 grow mb-4">
                {lobbySettingsView == "player" ? (
                  <>
                    <h3 className="text-primary">Color</h3>
                    <div className="inline-flex flex-wrap">
                      {colorList.map((v) => {
                        const outlineW =
                          playerColor == v ? "outline-2" : "outline-2 ";
                        const size =
                          playerColor == v ? "h-full w-full" : "h-12 w-12";
                        return (
                          <div
                            key={`scol-${v}`}
                            className="flex w-16 h-16 m-1 items-center justify-center"
                          >
                            <button
                              className={`${size} ${outlineW} outline outline-black`}
                              style={{ backgroundColor: v, borderRadius: 10 }}
                              onClick={() => {
                                setPlayerColor(v);
                                gameRoom.send("set_player_color", { value: v });
                              }}
                            ></button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  ""
                )}
                {lobbySettingsView == "game" ? (
                  <>
                    <h3 className="text-primary">Width</h3>
                    <InputNumber
                      id="game-width"
                      value={boardSize.w}
                      min={5}
                      max={10}
                      onInput={(val) =>
                        setBoardSize((bs) => {
                          return { w: val, h: bs.h };
                        })
                      }
                      onBlur={async () => {
                        try {
                          await gameRoom.send("set_board_width", {
                            value: boardSize.w,
                          });
                        } catch (ex) {
                          console.error(ex);
                        }
                      }}
                    ></InputNumber>
                    <h3 className="text-primary">Height</h3>
                    <InputNumber
                      id="game-height"
                      value={boardSize.h}
                      min={5}
                      max={10}
                      onInput={(val) =>
                        setBoardSize((bs) => {
                          return { w: bs.w, h: val };
                        })
                      }
                      onBlur={async () => {
                        try {
                          await gameRoom.send("set_board_height", {
                            value: boardSize.h,
                          });
                        } catch (ex) {
                          console.error(ex);
                        }
                      }}
                    ></InputNumber>
                  </>
                ) : (
                  ""
                )}
              </div>
              <div className="flex gap-8">
                <button
                  onClick={async () => {
                    await gameRoom.send("start_game");
                  }}
                  className="m-0 btn-lg"
                >
                  Start
                </button>
                <button
                  onClick={() => setlobbySettingsView("game")}
                  className="m-0 btn-lg"
                >
                  Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
