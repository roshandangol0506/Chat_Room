import { useState, useEffect } from "react";

type WebSocketHook = {
  messages: string[];
  sendMessage: (message: string) => void;
};

const useWebSocket = (room: string, selecteduser: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [active, setActive]= useState<string[]>([])

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000");
    setSocket(ws);

    ws.onopen = () => {
      ws.send(JSON.stringify({type:"joinRoom", room, selecteduser}))
    };

    ws.onmessage = (event: MessageEvent) => {
      try{
        const data= JSON.parse(event.data);
      if (data.type==="message"){
        setMessages((prev)=>[...prev, data.message])
      } else if (data.type==="invite"){
        alert(`Invitation:${data.message}`);
      } else if (data.type === "previousMessages") {
        const previousMessages = data.messages.map((msg: any) => `${msg.user.name}: ${msg.message}`);
        setMessages(previousMessages);
      } else if (data.type === "userUnavailable") {
        setMessages([data.message]); 
      }else if (data.type === "error"){
        setMessages([data.message]);
      }else if (data.type === "userActive") {
        setActive((prev) => [...new Set([...prev, data.user])]); 
      } else if (data.type === "userInactive") {
        setActive((prev) => prev.filter((user) => user !== data.user));
      }
      } catch{
        console.error("Received a non-JSON respond")
      }
      
    };

    return () => {
      ws.close();
    };
  }, [room, selecteduser]);

  const sendMessage = (message: string, user: string) => {
    socket?.send(JSON.stringify({type:"sendMessage", room, message, user}));
  };

  const inviteUser= (invitedby: string, inviteMessage: string, invitedto: string)=>{
    socket?.send(JSON.stringify({type:"inviteUser", room, invitedby, inviteMessage, invitedto}))
  };

  const createRoom= ()=>{
    socket?.send(JSON.stringify({type:"createRoom", room}))
  };

  return { active, messages, setActive, sendMessage, inviteUser, createRoom };
};

export default useWebSocket;
