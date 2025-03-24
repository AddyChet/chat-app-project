import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();

//when we pass the app here. what happens is we are saying --> let express handles the req and res
const server = http.createServer(app);

//Server here comes from socket --> which wraps your existing HTTP server (server) to enable WebSocket communication
//the cors here simple means allow cross origin resource sharing b/w websockets
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketID (userId) {
  return userSocketMap[userId]
}

const userSocketMap = {}
io.on("connection", (socket)=> {
    console.log("user connected", socket.id)

    const userId = socket.handshake.query.userId
    console.log("Received userId on connection:", userId);

    if(userId) userSocketMap[userId] = socket.id

    //sends evenst to all the clients basically broadcasts it to all
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", ()=>{
        console.log("user disconnected", socket.id)
        delete userSocketMap[userId]
        io.emit("getOnlineUsers", Object.keys(userSocketMap) )

    })
})

export {app, server, io};