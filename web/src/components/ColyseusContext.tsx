import React, { createContext, useContext } from "react";
import { Client } from "colyseus.js";
const apiUrl = import.meta.env.VITE_COLYSEUS_URL;
const client = new Client(apiUrl);
export const ColyseusContext = createContext(client);

export const ColyseusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ColyseusContext.Provider value={client}>{children}</ColyseusContext.Provider>;
};

export const useColyseus = () => useContext(ColyseusContext);