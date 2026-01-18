import './App.css'
import { Room } from './pages/Room'
import { Home } from './pages/Home';
import { useState } from 'react';
function App() {
  const [page, setPage] = useState<"home" | "room">("home");
  const [leaveMessage, setLeaveMessage] = useState("");
  return (
    <>
      {page === "home" && <Home goToRoom={() => setPage("room")} leaveMessage={leaveMessage} />}
      {page === "room" && <Room goToHome={(message)=>{
        setPage("home");
        setLeaveMessage(message);
        }}/>}
    </>
  )

}

export default App
