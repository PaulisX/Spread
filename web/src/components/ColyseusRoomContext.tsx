import React, { createContext, useContext, useState } from "react";
import { Room } from "colyseus.js";

interface ColyseusRoomContextType {
  room: Room | null;
  setRoom: (room: Room|null) => void;
}

const ColyseusRoomContext = createContext<ColyseusRoomContextType>({
  room: null,
  setRoom: () => {},
});

export const ColyseusRoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [room, setRoom] = useState<Room | null>(null);

  return (
    <ColyseusRoomContext.Provider value={{ room, setRoom}}>
      {children}
    </ColyseusRoomContext.Provider>
  );
};

export const useRoom = () => useContext(ColyseusRoomContext);