import { useState } from 'react'
import reactLogo from '@/assets/react.svg'
import viteLogo from '/vite.svg'
import spreadLogo from '/logo.png'
import spreadBanner from '/logo-wide.png'
import type { GameSchema } from "../../../server/src/rooms/schema/Game";
import '@/App.css'
import { useColyseus } from '../components/ColyseusContext';
import { useRoom } from '../components/ColyseusRoomContext';

interface HomeProps {
  goToRoom: () => void;
  leaveMessage: string;
}

export function Home({goToRoom}:HomeProps) {
  const client = useColyseus();
  const {setRoom} = useRoom();
  return (
    <>
    <div className="h-screen p-8">
      <div className='h-2/5  flex justify-center items-center'>
        <div className='flex flex-col'>
          <img src={spreadBanner}></img>
          <h3 className='text-center'>Game is under development!</h3>
        </div>
      </div>
      <div className='h-3/5 flex'>
        <div className="flex md:flex-row grow">
          <div className="w-full md:w-1/2 flex">
            <div className='rounded-lg bg-darken-10 outline-dark min-h-10 bg-opacity-10 m-8 p-8 grow flex flex-col justify-center'>
              <h3 className='text-primary'>Nickname</h3>
              <input id="userNick" type='text' className='mb-16'></input>
              <button className='btn-lg' onClick={async ()=>{
                try{
                  const userNickField = document.getElementById("userNick") as HTMLInputElement
                  const userNick = userNickField.value;
                  if(!userNick)
                    return;

                  const room = await client.create<GameSchema>("my_room",{name: userNick});
                  setRoom(room);
                  goToRoom();
                } catch(ex){
                  console.error(ex);
                }
              }}>NEW GAME</button>
              <button className='btn-lg' onClick={async ()=>{
                try{
                  const userNickField = document.getElementById("userNick") as HTMLInputElement
                  const userNick = userNickField.value;
                  if(!userNick)
                    return;

                  const room = await client.join<GameSchema>("my_room",{name:userNick});
                  setRoom(room);
                  goToRoom();
                } catch(ex){
                  console.error(ex);
                }
              }}>JOIN RANDOM</button>
            </div>
          </div>
          <div className="w-full md:w-1/2 flex">
            <div className='rounded-lg bg-darken-10 outline-dark min-h-10 bg-opacity-10 m-8 p-8 grow'>
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  )
}